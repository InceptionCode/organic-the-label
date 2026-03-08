import { Suspense } from "react";
import ProductContent, { type ProductHandleParam } from "@/app/store/[handle]/product-content";

// import OwnedLine from "./owned-line";

export default async function ProductPage(props: { params: Promise<ProductHandleParam> }) {
  return (
    <Suspense fallback="...loading">
      <ProductContent params={props.params} />
    </Suspense>
  );
}