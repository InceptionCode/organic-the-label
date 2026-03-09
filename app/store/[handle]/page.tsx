import { Suspense } from "react";
import ProductContent, { type ProductHandleParam } from "@/app/store/[handle]/product-content";
import { LoadingState } from "@/ui-components";

// import OwnedLine from "./owned-line";

export default async function ProductPage(props: { params: Promise<ProductHandleParam> }) {
  return (
    <Suspense fallback={<LoadingState />}>
      <ProductContent params={props.params} />
    </Suspense>
  );
}