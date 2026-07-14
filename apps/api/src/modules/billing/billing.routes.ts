import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '@vky/database';

// Configuración de Stripe
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

let stripeClient: any = null;

async function getStripe() {
  if (!stripeClient && STRIPE_SECRET_KEY) {
    const Stripe = (await import('stripe')).default;
    stripeClient = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' as any });
  }
  return stripeClient;
}

const CreateInvoiceSchema = z.object({
  patientId: z.string(),
  appointmentId: z.string().optional(),
  amount: z.number().min(0),
  currency: z.string().default('USD'),
  description: z.string().optional(),
  dueAt: z.string().datetime().optional(),
});

const UpdateInvoiceSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED']).optional(),
  description: z.string().optional(),
  dueAt: z.string().datetime().optional(),
});

const CreatePaymentSchema = z.object({
  invoiceId: z.string(),
  amount: z.number().min(0),
  method: z.enum(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'INSURANCE', 'STRIPE']),
});

export async function billingRoutes(app: FastifyInstance) {
  // ============================================
  // OBTENER TODAS LAS FACTURAS
  // ============================================
  app.get('/invoices', {
    preHandler: [app.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string; role: string };
    const { patientId, status, page = 1, limit = 10 } = request.query as {
      patientId?: string;
      status?: string;
      page?: number;
      limit?: number;
    };

    const where: any = {};

    if (patientId) where.patientId = patientId;
    if (status) where.status = status;

    // Filtrado por rol
    if (user.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId: user.id } });
      if (patient) where.patientId = patient.id;
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          patient: {
            include: { user: { select: { email: true } } },
          },
          payments: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  });

  // ============================================
  // OBTENER UNA FACTURA
  // ============================================
  app.get('/invoices/:id', {
    preHandler: [app.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        patient: {
          include: { user: { select: { email: true } } },
        },
        payments: true,
      },
    });

    if (!invoice) {
      return reply.status(404).send({
        success: false,
        error: 'Factura no encontrada',
      });
    }

    return reply.send({
      success: true,
      data: invoice,
    });
  });

  // ============================================
  // CREAR FACTURA
  // ============================================
  app.post('/invoices', {
    preHandler: [app.authenticate, app.authorize('billing:create')],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = CreateInvoiceSchema.parse(request.body);

    // Validar que el paciente existe
    const patient = await prisma.patient.findUnique({
      where: { id: body.patientId },
    });

    if (!patient) {
      return reply.status(404).send({
        success: false,
        error: 'Paciente no encontrado',
      });
    }

    // Crear factura en Stripe si está configurado
    let stripeInvoiceId = null;
    const stripe = await getStripe();

    if (stripe) {
      try {
        // Obtener o crear cliente en Stripe
        let customerId = patient.user?.email; // Using email as customer reference

        const invoice = await stripe.invoices.create({
          customer: customerId,
          amount: Math.round(body.amount * 100), // Convertir a centavos
          currency: body.currency.toLowerCase(),
          description: body.description,
          metadata: {
            patientId: body.patientId,
            appointmentId: body.appointmentId || '',
          },
        });

        stripeInvoiceId = invoice.id;
      } catch (error) {
        console.error('Error de Stripe:', error);
        // Continuar sin Stripe si hay error
      }
    }

    // Crear factura en la base de datos
    const dbInvoice = await prisma.invoice.create({
      data: {
        patientId: body.patientId,
        appointmentId: body.appointmentId,
        amount: body.amount,
        currency: body.currency,
        description: body.description,
        dueAt: body.dueAt ? new Date(body.dueAt) : undefined,
        stripeInvoiceId,
      },
      include: {
        patient: true,
      },
    });

    return reply.status(201).send({
      success: true,
      data: dbInvoice,
    });
  });

  // ============================================
  // ACTUALIZAR FACTURA
  // ============================================
  app.patch('/invoices/:id', {
    preHandler: [app.authenticate, app.authorize('billing:update')],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = UpdateInvoiceSchema.parse(request.body);

    const existing = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: 'Factura no encontrada',
      });
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        ...body,
        dueAt: body.dueAt ? new Date(body.dueAt) : undefined,
      },
      include: {
        patient: true,
        payments: true,
      },
    });

    return reply.send({
      success: true,
      data: invoice,
    });
  });

  // ============================================
  // CREAR PAGO
  // ============================================
  app.post('/payments', {
    preHandler: [app.authenticate, app.authorize('billing:create')],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = CreatePaymentSchema.parse(request.body);

    const invoice = await prisma.invoice.findUnique({
      where: { id: body.invoiceId },
    });

    if (!invoice) {
      return reply.status(404).send({
        success: false,
        error: 'Factura no encontrada',
      });
    }

    // Crear pago
    const payment = await prisma.payment.create({
      data: {
        invoiceId: body.invoiceId,
        amount: body.amount,
        method: body.method,
      },
    });

    // Calcular total de pagos
    const totalPayments = await prisma.payment.aggregate({
      where: { invoiceId: body.invoiceId },
      _sum: { amount: true },
    });

    const totalPaid = totalPayments._sum.amount || 0;

    // Actualizar estado de la factura
    if (totalPaid >= invoice.amount) {
      await prisma.invoice.update({
        where: { id: body.invoiceId },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      });
    }

    return reply.status(201).send({
      success: true,
      data: payment,
    });
  });

  // ============================================
  // OBTENER PAGOS
  // ============================================
  app.get('/payments', {
    preHandler: [app.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { invoiceId } = request.query as { invoiceId?: string };

    const where: any = {};
    if (invoiceId) where.invoiceId = invoiceId;

    const payments = await prisma.payment.findMany({
      where,
      include: {
        invoice: {
          select: { patientId: true, amount: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({
      success: true,
      data: payments,
    });
  });

  // ============================================
  // OBTENER ESTADÍSTICAS DE FACTURACIÓN
  // ============================================
  app.get('/billing/stats', {
    preHandler: [app.authenticate, app.authorize('billing:read')],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [
      totalInvoices,
      pendingInvoices,
      paidInvoices,
      monthlyRevenue,
      pendingAmount,
      overdueInvoices,
    ] = await Promise.all([
      prisma.invoice.count(),
      prisma.invoice.count({ where: { status: 'PENDING' } }),
      prisma.invoice.count({ where: { status: 'PAID' } }),
      prisma.invoice.aggregate({
        where: {
          status: 'PAID',
          paidAt: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      }),
      prisma.invoice.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true },
      }),
      prisma.invoice.count({ where: { status: 'OVERDUE' } }),
    ]);

    return reply.send({
      success: true,
      data: {
        totalInvoices,
        pendingInvoices,
        paidInvoices,
        overdueInvoices,
        monthlyRevenue: monthlyRevenue._sum.amount || 0,
        pendingAmount: pendingAmount._sum.amount || 0,
      },
    });
  });

  // ============================================
  // SESIÓN DE CHECKOUT STRIPE
  // ============================================
  app.post('/billing/checkout', {
    preHandler: [app.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { invoiceId } = request.body as { invoiceId: string };

    const stripe = await getStripe();
    if (!stripe) {
      return reply.status(503).send({
        success: false,
        error: 'Stripe no está configurado',
      });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { patient: true },
    });

    if (!invoice) {
      return reply.status(404).send({
        success: false,
        error: 'Factura no encontrada',
      });
    }

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: invoice.currency.toLowerCase(),
              product_data: {
                name: invoice.description || `Factura ${invoice.id.slice(0, 8)}`,
              },
              unit_amount: Math.round(invoice.amount * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_API_URL}/dashboard/billing?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_API_URL}/dashboard/billing?cancelled=true`,
        metadata: {
          invoiceId: invoice.id,
          patientId: invoice.patientId,
        },
      });

      return reply.send({
        success: true,
        data: {
          sessionId: session.id,
          url: session.url,
        },
      });
    } catch (error: any) {
      console.error('Error de checkout en Stripe:', error);
      return reply.status(500).send({
        success: false,
        error: 'Error al crear sesión de pago',
      });
    }
  });

  // ============================================
  // WEBHOOK DE STRIPE
  // ============================================
  app.post('/billing/webhook', async (request: FastifyRequest, reply: FastifyReply) => {
    const stripe = await getStripe();
    if (!stripe) {
      return reply.send({ status: 'ok' });
    }

    const sig = request.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      return reply.status(400).send({ error: 'Firma faltante' });
    }

    let event: any;

    try {
      event = stripe.webhooks.constructEvent(
        request.body as string,
        sig,
        webhookSecret
      );
    } catch (err: any) {
      console.error('Error en la verificación de la firma del webhook:', err.message);
      return reply.status(400).send({ error: err.message });
    }

    // Manejar eventos
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const invoiceId = session.metadata.invoiceId;

        if (invoiceId) {
          await prisma.invoice.update({
            where: { id: invoiceId },
            data: { status: 'PAID', paidAt: new Date() },
          });

          await prisma.payment.create({
            data: {
              invoiceId,
              amount: session.amount_total / 100,
              method: 'STRIPE',
              stripePaymentId: session.payment_intent,
            },
          });
        }
        break;
      }

      case 'invoice.paid': {
        console.log('Factura pagada:', event.data.object.id);
        break;
      }

      case 'invoice.payment_failed': {
        console.log('Pago fallido:', event.data.object.id);
        break;
      }
    }

    return reply.send({ status: 'ok' });
  });
}
