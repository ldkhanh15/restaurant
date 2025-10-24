import { useMutation } from '@tanstack/react-query';
import { login, logout, verifyToken, refreshToken, LoginRequest } from '@/api/auth';
import { useAuthStore } from '@/store';

export const useLogin = () => {
  const { login: storeLogin, setLoading } = useAuthStore();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => storeLogin(credentials),
    onMutate: () => {
      setLoading(true);
    },
    onError: () => {
      setLoading(false);
    },
  });
};

export const useLogout = () => {
  const { logout: storeLogout } = useAuthStore();

  return useMutation({
    mutationFn: () => storeLogout(),
  });
};

export const useVerifyToken = () => {
  const { checkAuth } = useAuthStore();

  return useMutation({
    mutationFn: () => checkAuth(),
  });
};

export const useRefreshToken = () => {
  const { checkAuth } = useAuthStore();

  return useMutation({
    mutationFn: () => checkAuth(),
  });
};