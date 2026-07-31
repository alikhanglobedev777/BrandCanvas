"use client";
import { StorefrontProductsPage } from "@/features/storefront";
import { useParams } from "next/navigation";
export default function Page(){ const {categorySlug}=useParams<{categorySlug:string}>(); return <StorefrontProductsPage categorySlug={categorySlug}/>; }
