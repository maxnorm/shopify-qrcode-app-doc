export type QRCodeData = {
  id?: number;
  title: string;
  destination: string;
  productId?: string;
  productVariantId?: string;
  productHandle?: string;
  productTitle?: string;
  productAlt?: string;
  productImage?: string;
  destinationUrl?: string;
  image?: string;
  productDeleted? : boolean;
  scans?: number;
  createdAt?: any;
};