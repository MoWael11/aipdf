export const PLANS = [
  {
    name: 'Free',
    slug: 'free',
    quota: 6,
    pagePerPdf: 5,
    price: {
      amount: 0,
      priceIds: {
        test: '',
        production: '',
      },
    },
  },
  {
    name: 'Pro',
    slug: 'pro',
    quota: 50,
    pagePerPdf: 25,
    price: {
      amount: 10,
      priceIds: {
        test: process.env.STRIPE_PRICE_API,
        production: process.env.STRIPE_PRICE_API,
      },
    },
  },
]
