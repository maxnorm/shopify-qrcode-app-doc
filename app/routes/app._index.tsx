import { json } from "@remix-run/node";
import { useLoaderData, Link, useNavigate } from "@remix-run/react";
import {authenticate} from "../shopify.server";
import {
  Card,
  EmptyState,
  Layout,
  Page,
  IndexTable,
  Thumbnail,
  Text,
  Icon,
  InlineStack
} from "@shopify/polaris";

import { getQRCodes } from "app/models/QRCode.server";
import { AlertDiamondIcon, ImageIcon } from "@shopify/polaris-icons";
import { QRCodeData } from "../types/qrCodeData";

export async function loader({request}: {request: Request}) {
  const {admin, session} = await authenticate.admin(request);
  const qrCodes = await getQRCodes(session.shop, admin.graphql)

  return json({
    qrCodes
  })
}

function truncate(str: string, {length = 25} = {}) {
  if(!str) return "";
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

const EmptyQRCodeState = ({onAction}: {onAction: () => void}) => (
  <EmptyState
    heading="Create unique QR codes for your products"
    action={{ content: "Create QR code", onAction }}
    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
  >
    <p>Allow your customers to scan QR codes and buy products using their phones.</p>
  </EmptyState>
);

const QRCTable = ({qrCodes}: {qrCodes: QRCodeData[]}) => (
  <IndexTable 
   resourceName={{
    singular: "QR code",
    plural: "QR codes"
   }}
   itemCount={qrCodes.length}
   headings={[
    {title: "Thumbnail", hidden: true},
    {title: "Title"},
    {title: "Product"},
    {title: "Scans"},
    {title: "Created At"},
   ]}
   selectable={false}
  >
    {qrCodes.map((qrCode) => (
      <QRCTableRow key={qrCode.id} qrCode={qrCode} />
    ))}
  </IndexTable>
);

const QRCTableRow = ({qrCode}: {qrCode: QRCodeData}) => (
  <IndexTable.Row id={qrCode.id?.toString() || ""} position={qrCode.id || 0}>
    <IndexTable.Cell>
      <Thumbnail
        source={qrCode.productImage || ImageIcon}
        alt={qrCode.productTitle || "Default Image Icon"}
        size="small"
      />
    </IndexTable.Cell>
    <IndexTable.Cell>
      <Link to={`qrcodes/${qrCode.id}`}>{truncate(qrCode.title)}</Link>
    </IndexTable.Cell>
    <IndexTable.Cell>
      {qrCode.productDeleted ? (
          <InlineStack align="start" gap="200">
            <span>
              <Icon source={AlertDiamondIcon} tone="critical"/>
            </span>
            <Text tone="critical" as="span">
              Product has been deleted
            </Text>
          </InlineStack>
        ) : (
          truncate(qrCode.productTitle || "")
        )
      }
    </IndexTable.Cell>
    <IndexTable.Cell>{qrCode.scans}</IndexTable.Cell>
    <IndexTable.Cell>
      {new Date(qrCode.createdAt).toDateString()}
    </IndexTable.Cell>
  </IndexTable.Row>
);

export default function Index() {
  const {qrCodes} = useLoaderData<{qrCodes: QRCodeData[]}>();
  const navigate = useNavigate();

  return (
    <Page>
      <ui-title-bar title="QR codes">
        <button variant="primary" onClick={() => navigate("/app/qrcodes/new")}>
          Create QR Code
        </button>
      </ui-title-bar>
      <Layout>
        <Layout.Section>
          <Card padding="0">
            {qrCodes.length === 0 ? (
              <EmptyQRCodeState onAction={() => navigate("qrcodes/new")}/>
            ) : (
              <QRCTable qrCodes={qrCodes}/>
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  )
}