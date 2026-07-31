"use client";
import { StorefrontProductsPage } from "@/features/storefront";
import { useParams } from "next/navigation";
export default function Page(){ const {collectionSlug}=useParams<{collectionSlug:string}>(); return <StorefrontProductsPage collectionSlug={collectionSlug}/>; }
