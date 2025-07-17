import { cookies } from 'next/headers';
import { getCart, getProduct, getProducts, bigCommerceFetch } from './bigcommerce';
import type { VercelCart, VercelProduct } from './bigcommerce/types';

export interface RCAStoreObjects {
  graphql_token: string;
  currency: {
    default: any;
    current: any;
  };
  customer: {
    email: string | null;
    id: number | null;
    orders: any[] | null;
    customer_group_id: number | null;
    customer_group_name: string | null;
    address: any | null;
  };
  cart: {
    coupons: any[] | null;
    discount: any | null;
    gift_certificates: any[] | null;
    gift_wrapping_cost: any | null;
    grand_total: any | null;
    items: any[] | null;
    quantity: number | null;
    shipping_handling: any | null;
    show_primary_checkout_button: boolean | null;
    status_messages: any[] | null;
    sub_total: any | null;
    taxes: any | null;
  };
  cart_id: string;
  page_type: string;
  order: any | null;
  product: {
    id: number | null;
    options: any[] | null;
    title: string | null;
    price: any | null;
  };
  product_results: {
    pagination: any | null;
    products: Array<{
      id: number;
      options: any[] | null;
      title: string;
      price: any;
    }>;
  };
  products: Array<{
    id: number;
    options: any[] | null;
    title: string;
    price: any;
  }>;
  store_hash: string;
  theme_settings: any;
}

// Customer GraphQL Queries
const GET_CUSTOMER_QUERY = `
  query getCustomer {
    customer {
      entityId
      firstName
      lastName
      email
      company
      phone
      customerGroupId
      formFields {
        entityId
        name
        ... on TextFormFieldValue {
          textValue: text
        }
        ... on MultipleChoiceFormFieldValue {
          choiceValue: valueEntityId
        }
        ... on NumberFormFieldValue {
          numberValue: number
        }
        ... on DateFormFieldValue {
          dateValue: date {
            utc
          }
        }
        ... on CheckboxesFormFieldValue {
          checkboxValues: valueEntityIds
        }
        ... on PasswordFormFieldValue {
          passwordValue: password
        }
      }
      addresses {
        edges {
          node {
            entityId
            firstName
            lastName
            company
            address1
            address2
            city
            stateOrProvince
            postalCode
            countryCode
            phone
            formFields {
              entityId
              name
              ... on TextFormFieldValue {
                textValue: text
              }
              ... on MultipleChoiceFormFieldValue {
                choiceValue: valueEntityId
              }
              ... on NumberFormFieldValue {
                numberValue: number
              }
              ... on DateFormFieldValue {
                dateValue: date {
                  utc
                }
              }
              ... on CheckboxesFormFieldValue {
                checkboxValues: valueEntityIds
              }
              ... on PasswordFormFieldValue {
                passwordValue: password
              }
            }
          }
        }
      }
      storeCredit {
        value
        currencyCode
      }
      attributeCount
      addressCount
    }
  }
`;

const GET_CUSTOMER_ORDERS_QUERY = `
  query getCustomerOrders($filters: OrdersFiltersInput) {
    customer {
      orders(filters: $filters, first: 10) {
        edges {
          node {
            entityId
            orderedAt {
              utc
            }
            status {
              value
              label
            }
            totalIncTax {
              value
              currencyCode
            }
            consignments {
              shipping {
                edges {
                  node {
                    entityId
                    lineItems {
                      edges {
                        node {
                          entityId
                          productEntityId
                          parentLineItemEntityId
                          quantity
                          name
                          image {
                            url(width: 150)
                          }
                          subTotalSalePrice {
                            value
                            currencyCode
                          }
                          brand
                          productOptions {
                            name
                            value
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

// Customer Data Types
interface CustomerFormFieldValue {
  entityId: number;
  name: string;
  textValue?: string;
  choiceValue?: number;
  numberValue?: number;
  dateValue?: { utc: string };
  checkboxValues?: number[];
  passwordValue?: string;
}

interface BigCommerceCustomer {
  entityId: number;
  firstName: string;
  lastName: string;
  email: string;
  company: string | null;
  phone: string | null;
  customerGroupId: number | null;
  formFields: CustomerFormFieldValue[];
  addresses: {
    edges: Array<{
      node: {
        entityId: number;
        firstName: string;
        lastName: string;
        company: string | null;
        address1: string;
        address2: string | null;
        city: string;
        stateOrProvince: string;
        postalCode: string;
        countryCode: string;
        phone: string | null;
        formFields: CustomerFormFieldValue[];
      };
    }>;
  };
  storeCredit: {
    value: number;
    currencyCode: string;
  } | null;
  attributeCount: number;
  addressCount: number;
}

interface BigCommerceCustomerOrders {
  orders: {
    edges: Array<{
      node: {
        entityId: number;
        orderedAt: {
          utc: string;
        };
        status: {
          value: string;
          label: string;
        };
        totalIncTax: {
          value: number;
          currencyCode: string;
        };
        consignments: {
          shipping: {
            edges: Array<{
              node: {
                entityId: number;
                lineItems: {
                  edges: Array<{
                    node: {
                      entityId: number;
                      productEntityId: number;
                      parentLineItemEntityId: number | null;
                      quantity: number;
                      name: string;
                      image: {
                        url: string;
                      } | null;
                      subTotalSalePrice: {
                        value: number;
                        currencyCode: string;
                      };
                      brand: string;
                      productOptions: Array<{
                        name: string;
                        value: string;
                      }>;
                    };
                  }>;
                };
              };
            }>;
          };
        };
      };
    }>;
  };
}

type BigCommerceCustomerOperation = {
  data: {
    customer: BigCommerceCustomer;
  };
  variables?: never;
};

type BigCommerceCustomerOrdersOperation = {
  data: {
    customer: BigCommerceCustomerOrders;
  };
  variables: {
    filters?: {
      status?: string;
    };
  };
};

function transformVercelCartToRCA(cart: VercelCart | undefined) {
  if (!cart) {
    return {
      coupons: null,
      discount: null,
      gift_certificates: null,
      gift_wrapping_cost: null,
      grand_total: null,
      items: null,
      quantity: null,
      shipping_handling: null,
      show_primary_checkout_button: null,
      status_messages: null,
      sub_total: null,
      taxes: null
    };
  }

  return {
    coupons: [],
    discount: null,
    gift_certificates: [],
    gift_wrapping_cost: null,
    grand_total: {
      value: parseFloat(cart.cost.totalAmount.amount),
      currency_code: cart.cost.totalAmount.currencyCode
    },
    items: cart.lines.map((line) => ({
      id: line.merchandise.id,
      product_id: line.merchandise.product.id,
      name: line.merchandise.title,
      quantity: line.quantity,
      price: {
        value: parseFloat(line.cost.totalAmount.amount),
        currency_code: line.cost.totalAmount.currencyCode
      }
    })),
    quantity: cart.totalQuantity,
    shipping_handling: null,
    show_primary_checkout_button: true,
    status_messages: [],
    sub_total: {
      value: parseFloat(cart.cost.subtotalAmount.amount),
      currency_code: cart.cost.subtotalAmount.currencyCode
    },
    taxes: {
      value: parseFloat(cart.cost.totalTaxAmount.amount),
      currency_code: cart.cost.totalTaxAmount.currencyCode
    }
  };
}

function transformVercelProductToRCA(product: VercelProduct | undefined) {
  if (!product) {
    return {
      id: null,
      options: null,
      title: null,
      price: null
    };
  }

  return {
    id: parseInt(product.id),
    options: product.options.map((option) => ({
      id: option.id,
      name: option.name,
      values: option.values
    })),
    title: product.title,
    price: {
      value: parseFloat(product.priceRange.minVariantPrice.amount),
      currency_code: product.priceRange.minVariantPrice.currencyCode
    }
  };
}

function transformVercelProductsToRCA(products: VercelProduct[]) {
  return products.map((product) => ({
    id: parseInt(product.id),
    options: product.options.map((option) => ({
      id: option.id,
      name: option.name,
      values: option.values
    })),
    title: product.title,
    price: {
      value: parseFloat(product.priceRange.minVariantPrice.amount),
      currency_code: product.priceRange.minVariantPrice.currencyCode
    }
  }));
}

// Customer Data Fetching Functions
async function getCustomerData(customerId: number): Promise<BigCommerceCustomer | null> {
  try {
    const res = await bigCommerceFetch<BigCommerceCustomerOperation>({
      query: GET_CUSTOMER_QUERY,
      headers: {
        'X-Bc-Customer-Id': customerId.toString()
      },
      cache: 'no-store'
    });

    return res.body.data.customer;
  } catch (error) {
    console.error('Error fetching customer data:', error);
    return null;
  }
}

async function getCustomerOrders(
  customerId: number
): Promise<BigCommerceCustomerOrders['orders'] | null> {
  try {
    const res = await bigCommerceFetch<BigCommerceCustomerOrdersOperation>({
      query: GET_CUSTOMER_ORDERS_QUERY,
      variables: {
        filters: { status: 'COMPLETED' }
      },
      headers: {
        'X-Bc-Customer-Id': customerId.toString()
      },
      cache: 'no-store'
    });

    return res.body.data.customer.orders;
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    return null;
  }
}

// Customer Data Transformation Functions
function transformBigCommerceCustomerToRCA(
  customer: BigCommerceCustomer | null,
  orders: BigCommerceCustomerOrders['orders'] | null
) {
  if (!customer) {
    return {
      email: null,
      id: null,
      orders: null,
      customer_group_id: null,
      customer_group_name: null,
      address: null
    };
  }

  // Transform orders to RCA format
  const transformedOrders =
    orders?.edges.map(({ node: order }) => ({
      id: order.entityId,
      date: order.orderedAt.utc,
      status: order.status.value,
      status_label: order.status.label,
      total: {
        value: order.totalIncTax.value,
        currency_code: order.totalIncTax.currencyCode
      },
      items: order.consignments.shipping.edges.flatMap(({ node: consignment }) =>
        consignment.lineItems.edges.map(({ node: item }) => ({
          id: item.entityId,
          product_id: item.productEntityId,
          parent_line_item_id: item.parentLineItemEntityId,
          name: item.name,
          quantity: item.quantity,
          image_url: item.image?.url || null,
          brand: item.brand,
          price: {
            value: item.subTotalSalePrice.value,
            currency_code: item.subTotalSalePrice.currencyCode
          },
          product_options: item.productOptions
        }))
      )
    })) || null;

  // Get primary address
  const primaryAddress =
    customer.addresses.edges.length > 0 ? customer.addresses.edges[0]?.node : null;

  return {
    email: customer.email,
    id: customer.entityId,
    orders: transformedOrders,
    customer_group_id: customer.customerGroupId,
    customer_group_name: null, // Not available in current query
    address: primaryAddress
      ? {
          first_name: primaryAddress.firstName,
          last_name: primaryAddress.lastName,
          company: primaryAddress.company,
          address1: primaryAddress.address1,
          address2: primaryAddress.address2,
          city: primaryAddress.city,
          state: primaryAddress.stateOrProvince,
          postal_code: primaryAddress.postalCode,
          country_code: primaryAddress.countryCode,
          phone: primaryAddress.phone
        }
      : null
  };
}

// Customer ID Management
function getCustomerId(): number | null {
  const cookieStore = cookies();

  // Check for customer ID in cookie (from authentication)
  const customerIdCookie = cookieStore.get('customerId')?.value;
  if (customerIdCookie) {
    const customerId = parseInt(customerIdCookie, 10);
    if (!isNaN(customerId)) {
      return customerId;
    }
  }

  // Check for customer ID in environment variable (for development/testing)
  const envCustomerId = process.env.BIGCOMMERCE_CUSTOMER_ID;
  if (envCustomerId) {
    const customerId = parseInt(envCustomerId, 10);
    if (!isNaN(customerId)) {
      return customerId;
    }
  }

  return null;
}

export async function generateRCAStoreObjects(
  pageType: string = 'default',
  productHandle?: string,
  searchQuery?: string
): Promise<RCAStoreObjects> {
  const cookieStore = cookies();
  const cartId = cookieStore.get('cartId')?.value || '';

  // Get customer ID and fetch customer data if available
  const customerId = getCustomerId();
  let customerData = null;
  let customerOrders = null;

  if (customerId) {
    // Fetch customer data and orders in parallel
    const [customer, orders] = await Promise.all([
      getCustomerData(customerId),
      getCustomerOrders(customerId)
    ]);

    customerData = customer;
    customerOrders = orders;
  }

  // Get cart data
  const cart = cartId ? await getCart(cartId) : undefined;

  // Get product data if on product page
  const product = productHandle ? await getProduct(productHandle) : undefined;

  // Get search results or featured products
  const products = searchQuery
    ? await getProducts({ query: searchQuery })
    : await getProducts({ sortKey: 'CREATED_AT', reverse: true });

  return {
    graphql_token: process.env.BIGCOMMERCE_CUSTOMER_IMPERSONATION_TOKEN || '',
    currency: {
      default: { code: 'USD', symbol: '$' },
      current: { code: 'USD', symbol: '$' }
    },
    customer: transformBigCommerceCustomerToRCA(customerData, customerOrders),
    cart: transformVercelCartToRCA(cart),
    cart_id: cartId,
    page_type: pageType,
    order: null,
    product: transformVercelProductToRCA(product),
    product_results: {
      pagination: null,
      products: transformVercelProductsToRCA(products.slice(0, 10))
    },
    products: transformVercelProductsToRCA(products.slice(0, 10)),
    store_hash: process.env.BIGCOMMERCE_STORE_HASH || '',
    theme_settings: {}
  };
}

export function generateRCAStoreObjectsScript(storeObjects: RCAStoreObjects): string {
  return `
    <script>
      (function() {
        window.RCA_store_objects = ${JSON.stringify(storeObjects, null, 2)};
      })();
    </script>
  `;
}
