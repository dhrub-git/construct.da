import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import type { AppDispatch } from "./store";
import type { RootState } from "./store";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();