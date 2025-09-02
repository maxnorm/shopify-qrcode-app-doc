import {redirect} from "@remix-run/node";
import invariant from "tiny-invariant";
import db from "../db.server";
import { getDestinationURL } from "app/models/QRCode.server";

export const loader = async ({ params } : {params: any}) => {
  const error = "Could not find QR code destination";

  invariant(params.id, error);

  const id = Number(params.id);
  const qrCode = await db.qRCode.findFirst({where: {id}});

  invariant(qrCode, error);

  await db.qRCode.update({
    where: {id},
    data: {scans: {increment: 1}}
  });

  return redirect(getDestinationURL(qrCode));
}