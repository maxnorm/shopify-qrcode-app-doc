import qrcode from "qrcode";
import invariant from "tiny-invariant";
import db from "../db.server";
import { QRCode } from "@prisma/client";
import { GraphQLClient } from "node_modules/@shopify/shopify-app-remix/dist/ts/server/clients/types";
/**
 * Get one QR Code by ID
 * @param id ID of the code
 * @param graphql GraphQL Client
 * @returns Retrun the QR code
 */
export async function getQRCode(id: number, graphql: GraphQLClient<any>) {
  const qrCode = await db.qRCode.findFirst({where: {id}})

  if (!qrCode) return null;

  return supplementQRCode(qrCode, graphql);
}

/**
 * Get all the QR codes from a shop
 * @param shop Shop ID
 * @param graphql GraphQL Client
 * @returns All the specified shop QR codes
 */
export async function getQRCodes(shop: string, graphql: GraphQLClient<any>) {
  const qrCodes = await db.qRCode.findMany({
    where: {shop},
    orderBy: {id:"desc"}
  });

  if (qrCodes.length === 0) return [];

  return Promise.all(
    qrCodes.map((qrCodes) => supplementQRCode(qrcode, graphql))
  );
}

/**
 * Get the QR code image
 * @param id ID of the code
 * @returns QR code image
 */
export function getQRCodeImage(id: number) {
  const url = new URL(`/qrcodes/${id}/scan`, process.env.SHOPIFY_APP_URL);
  return qrcode.toDataURL(url.href);
}

/**
 * Build the URL based on product and destination inside the code
 * @param qrCode QR Code
 * @returns Built Destination URL
 */
export function getDestinationURL(qrCode: QRCode) {
  if (qrCode.destination === "product") {
    return `https://${qrCode.shop}/products/${qrCode.productHandle}`;
  }

  const match = /gid:\/\/shopify\/ProductVariant\/([0-9]+)/.exec(qrCode.productVariantId);
  invariant(match, "Unrecognized product variant ID");

  return `https://${qrCode.shop}/cart/${match[1]}:1`;
}

/**
 * Supplement the QR Code with the product information like title & image
 * @param qrCode QR Code Entity
 * @param graphql GraphQL Client
 * @returns 
 */
async function supplementQRCode(qrCode: QRCode, graphql: GraphQLClient<any>) {
  const qrCodeImagePromise = getQRCodeImage(qrCode.id)

  const response = await graphql(`
    query supplementQRCode($id: ID!) {
      product(id: $id) {
        title
        media(first: 1) {
          nodes {
            preview {
              image {
                altText
                url
              }
            }
          }
        }
      }
    }`,
    {
      variables: {
        id: qrCode.productId
      }
    }
  );

  const { data: { product } } = await response.json();

  return {
    ...qrCode,
    productDeleted: !product?.title,
    prodcutTitle: product?.title,
    productImage: product?.media?.nodes[0]?.preview?.image?.url,
    productAlt: product?.media?.nodes[0]?.preview?.image?.altText,
    destinationUrl: getDestinationURL(qrCode),
    image: await qrCodeImagePromise
  }
}

/**
 * Form validation for QR code submission
 * @param data Form data
 * @returns Errors if invalid
 */
export function validateQRCode(data: { title?: string; productId?: string; destination?: string }) {
  const errors: Record<string, string> = {};

  if (!data.title) {
    errors.title = "Title is required";
  }

  if (!data.productId) {
    errors.productId = "Product is required";
  }

  if (!data.destination) {
    errors.destination = "Destination is required";
  }

  if (Object.keys(errors).length) {
    return errors;
  }
}


