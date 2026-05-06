const axios = require('axios');

const BC_MCP_URL = process.env.BC_MCP_URL || 'http://localhost:3001';
const USE_MOCK = process.env.BC_MOCK === 'true';

// ─── Fonction principale ───────────────────────────────────────────────────────

async function callBCTool(toolName, args = {}) {
  if (USE_MOCK) {
    console.log(`[BC MOCK] ${toolName}`, args);
    return getMockResponse(toolName, args);
  }

  try {
    const { data } = await axios.post(
      `${BC_MCP_URL}/tools/${toolName}`,
      { arguments: args }
    );
    if (data.error) throw new Error(data.error);
    return data.result;
  } catch (error) {
    throw new Error(`BC MCP Error [${toolName}]: ${error.message}`);
  }
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

function getMockResponse(toolName, args) {
  switch (toolName) {

    case 'find_or_create_customer':
      return {
        customer: { id: `cust-mock-001`, displayName: args.name },
        created: false
      };

    case 'find_or_create_item':
      return {
        item: { id: `item-mock-001`, displayName: args.description, unitPrice: args.unitPrice || 0 },
        created: false
      };

    case 'create_sales_invoice':
      return {
        id: `inv-mock-${Date.now()}`,
        number: `SINV-MOCK-001`,
        customerName: args.customerName || '',
        status: 'Draft'
      };

    case 'add_sales_invoice_line':
      return {
        id: `line-mock-${Date.now()}`,
        documentId: args.documentId,
        description: args.description,
        quantity: args.quantity,
        unitPrice: args.unitPrice
      };

    case 'post_sales_invoice':
      return { id: args.id, status: 'Open' };

    case 'create_sales_order':
      return {
        id: `so-mock-${Date.now()}`,
        number: `SO-MOCK-001`,
        customerName: args.customerName || '',
        status: 'Draft'
      };

    case 'add_sales_order_line':
      return {
        id: `line-mock-${Date.now()}`,
        documentId: args.documentId,
        description: args.description,
        quantity: args.quantity
      };

    case 'create_purchase_order':
      return {
        id: `po-mock-${Date.now()}`,
        number: `PO-MOCK-001`,
        vendorName: args.vendorName || '',
        status: 'Draft'
      };

    case 'add_purchase_order_line':
      return {
        id: `line-mock-${Date.now()}`,
        documentId: args.documentId,
        description: args.description,
        quantity: args.quantity
      };

    default:
      return { success: true, tool: toolName, mock: true };
  }
}
async function checkHealth() {
  try {
    const { data } = await axios.get(`${BC_MCP_URL}/health`);
    return { connected: true, ...data };
  } catch (error) {
    return { connected: false, error: error.message };
  }
}
// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  // Customers
  checkHealth,
  findCustomerByName: (name) => callBCTool('find_customer_by_name', { name }),
  findOrCreateCustomer: (name, extra = {}) =>
    callBCTool('find_or_create_customer', { name, ...extra }),

  // Items
  findItemByDescription: (description) => callBCTool('find_item_by_description', { description }),
  findOrCreateItem: (description, extra = {}) =>
    callBCTool('find_or_create_item', { description, ...extra }),

  // Sales Invoice
  createSalesInvoice: (args) => callBCTool('create_sales_invoice', args),
  addSalesInvoiceLine: (args) => callBCTool('add_sales_invoice_line', args),
  postSalesInvoice: (id) => callBCTool('post_sales_invoice', { id }),

  // Sales Order
  createSalesOrder: (args) => callBCTool('create_sales_order', args),
  addSalesOrderLine: (args) => callBCTool('add_sales_order_line', args),

  // Purchase Order
  findVendorByName: (name) => callBCTool('find_vendor_by_name', { name }),
  createPurchaseOrder: (args) => callBCTool('create_purchase_order', args),
  addPurchaseOrderLine: (args) => callBCTool('add_purchase_order_line', args),

  //Devis
  createSalesQuote: (args) => callBCTool('create_sales_quote', args),
  addSalesQuoteLine: (args) => callBCTool('add_sales_quote_line', args),
  // Facture Achat
  createPurchaseInvoice: (args) => callBCTool('create_purchase_invoice', args),
  addPurchaseInvoiceLine: (args) => callBCTool('add_purchase_invoice_line', args),
};