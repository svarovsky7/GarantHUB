import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/shared/config/queryClient";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode data-oid="1on4tqp">
    <QueryClientProvider client={queryClient} data-oid="wbf.rtk">
      <BrowserRouter data-oid="bj59asp">
        <App data-oid="z9suoo-" />
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} data-oid="fcpiyun" />
    </QueryClientProvider>
  </React.StrictMode>,
);
