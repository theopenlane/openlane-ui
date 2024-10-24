import { NextRequest, NextResponse } from 'next/server'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
  Image,
} from '@react-pdf/renderer'
import { z } from 'zod'
import { tailwindToPdfStyles } from '@/utils/tailwind.pdf'

const styles = (overrides: any) =>
  StyleSheet.create({
    page: {
      padding: 30,
      fontSize: 12,
      fontFamily: 'Helvetica',
      color: overrides.textColor,
    },
    logo: {
      width: overrides.logoWidth,
      height: overrides.logoHeight,
      marginBottom: 10,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    companyInfo: {
      textAlign: 'right',
    },
    clientInfo: {
      marginBottom: 20,
    },
    invoiceInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    table: {
      width: '100%',
      marginTop: 20,
      marginBottom: 60,
    },
    tableRow: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      paddingVertical: 5,
      borderBottom: `1pt solid ${overrides.borderColor}`,
      textAlign: 'left',
    },
    tableQty: {
      width: '10%',
    },
    tableDesc: {
      width: '40%',
    },
    tablePrice: {
      width: '25%',
    },
    tableSubtotal: {
      width: '25%',
      textAlign: 'right',
    },
    tableHeader: {
      fontWeight: 'bold',
    },
    paymentInfo: {
      marginBottom: 20,
    },
    totalDue: {
      textAlign: 'right',
      fontSize: 16,
      fontWeight: 'bold',
    },
    note: {
      textAlign: 'center',
      marginTop: 20,
    },
  })

// Zod validation schemas
const JsonSchema = z.object({
  logo: z.string().optional(),
  company: z.object({
    name: z.string(),
    address: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    email: z.string(),
  }),
  client: z.object({
    name: z.string(),
  }),
  invoice: z.object({
    date: z.string(),
    number: z.string(),
  }),
  items: z.array(
    z.object({
      qty: z.number(),
      description: z.string(),
      price: z.number(),
      subtotal: z.number(),
    }),
  ),
  payment_info: z.object({
    account_no: z.string(),
    routing_no: z.string(),
  }),
  due_by: z.string(),
  total_due: z.number(),
  note: z.string().optional(),
})

const UiSchema = z.object({
  overrides: z.record(z.any()).optional(),
})

const RequestBodySchema = z.object({
  jsonSchema: JsonSchema,
  uiSchema: UiSchema,
  format: z.enum(['pdf', 'html']),
})

const MyDocument = ({ data, overrides }: { data: any; overrides: any }) => (
  <Document>
    <Page size="A4" style={styles(overrides).page}>
      <View style={styles(overrides).header}>
        {data.logo && <Image style={styles(overrides).logo} src={data.logo} />}
        <View style={styles(overrides).companyInfo}>
          <Text>{data.company.name}</Text>
          <Text>{data.company.address}</Text>
          <Text>
            {data.company.city}, {data.company.state} {data.company.zip}
          </Text>
          <Text>{data.company.email}</Text>
        </View>
      </View>
      <View style={styles(overrides).clientInfo}>
        <Text>Client Name: {data.client.name}</Text>
      </View>
      <View style={styles(overrides).invoiceInfo}>
        <Text>Invoice Date: {data.invoice.date}</Text>
        <Text>Invoice No: {data.invoice.number}</Text>
      </View>
      <View style={styles(overrides).table}>
        <View
          style={[styles(overrides).tableRow, styles(overrides).tableHeader]}
        >
          <Text style={styles(overrides).tableQty}>QTY</Text>
          <Text style={styles(overrides).tableDesc}>DESCRIPTION</Text>
          <Text style={styles(overrides).tablePrice}>PRICE</Text>
          <Text style={styles(overrides).tableSubtotal}>SUBTOTAL</Text>
        </View>
        {data.items.map((item: any, index: any) => (
          <View key={index} style={styles(overrides).tableRow}>
            <Text style={styles(overrides).tableQty}>{item.qty}</Text>
            <Text style={styles(overrides).tableDesc}>{item.description}</Text>
            <Text style={styles(overrides).tablePrice}>
              ${item.price.toFixed(2)}
            </Text>
            <Text style={styles(overrides).tableSubtotal}>
              ${item.subtotal.toFixed(2)}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles(overrides).paymentInfo}>
        <Text>Account No: {data.payment_info.account_no}</Text>
        <Text>Routing No: {data.payment_info.routing_no}</Text>
        <Text>Due By: {data.due_by}</Text>
      </View>
      <View style={styles(overrides).totalDue}>
        <Text>Total Due: ${data.total_due.toFixed(2)}</Text>
      </View>
      {data.note && (
        <View style={styles(overrides).note}>
          <Text>{data.note}</Text>
        </View>
      )}
    </Page>
  </Document>
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsedBody = RequestBodySchema.parse(body)
    const { jsonSchema, uiSchema, format } = parsedBody

    if (format === 'pdf') {
      // Generate PDF
      try {
        const pdfStyles = tailwindToPdfStyles(uiSchema.overrides)
        const pdfDocument = (
          <MyDocument data={jsonSchema} overrides={pdfStyles} />
        )
        const pdfStream = await pdf(pdfDocument).toBlob()
        const pdfBuffer = Buffer.from(await pdfStream.arrayBuffer())

        const headers = new Headers()
        headers.append('Content-Type', 'application/pdf')
        headers.append(
          'Content-Disposition',
          `attachment; filename=invoice${jsonSchema.invoice.number}.pdf`,
        )

        return new Response(pdfBuffer, { headers })
      } catch (pdfError) {
        return NextResponse.json(
          { error: 'Failed to generate PDF document', details: pdfError },
          { status: 500 },
        )
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid format. Supported formats: pdf, html' },
        { status: 400 },
      )
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 },
      )
    }
    return NextResponse.json(
      { error: 'Failed to generate document', details: error },
      { status: 500 },
    )
  }
}
