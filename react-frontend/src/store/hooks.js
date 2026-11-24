import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from './slices/auth/authSlice';

export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;
export const useCurrentUser = () => useAppSelector(selectCurrentUser);
