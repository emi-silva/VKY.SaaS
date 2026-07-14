'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/lib/api';

export default function TwoFactorSetupPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setup2FA();
  }, []);

  const setup2FA = async () => {
    try {
      const { data } = await authApi.setup2FA();
      setQrCode(data.data.qrCode);
      setSecret(data.data.secret);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al configurar 2FA');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authApi.verify2FA(code);
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/settings');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-primary-600">VKY.SaaS</h1>
          <h2 className="mt-2 text-center text-xl text-gray-600">Configurar 2FA</h2>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-center">
            2FA habilitado correctamente
          </div>
        ) : (
          <>
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
              <p className="font-medium mb-2">Pasos para configurar 2FA:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Descarga Google Authenticator o Authy</li>
                <li>Escanea el código QR</li>
                <li>Ingresa el código de 6 dígitos</li>
              </ol>
            </div>

            {qrCode && (
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <Image src={qrCode} alt="QR Code" width={200} height={200} />
                </div>
              </div>
            )}

            {secret && (
              <div className="bg-gray-100 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">O ingresa este código manualmente:</p>
                <p className="font-mono text-sm break-all">{secret}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleVerify}>
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                  Código de verificación
                </label>
                <input
                  id="code"
                  type="text"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-center text-2xl tracking-widest"
                  placeholder="000000"
                />
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {loading ? 'Verificando...' : 'Habilitar 2FA'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
