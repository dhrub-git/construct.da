import { combineReducers, configureStore } from "@reduxjs/toolkit";
import projectReducer from "./projectSlice";
import dashboardReducer from "./dashboardSlice";

const rootReducer = combineReducers({
    project: projectReducer,
    dashboard: dashboardReducer,
    //add all your reducers here
});

const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;