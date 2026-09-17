const u = (id, w = 800) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`

export const heroSlides = [
  {
    bg: u('1581092160562-40aa08e78837', 1600),
    side: u('1581092918056-0c4c3ae59e7b', 700)
  },
  {
    bg: u('1498050108023-c5249f4df085', 1600),
    side: u('1518770660439-4636190af475', 700)
  },
  {
    bg: u('1511707171634-5f897ff02aa9', 1600),
    side: u('1527867190162-a1e8a047c738', 700)
  }
]

export const about = {
  main: u('1581092918056-0c4c3ae59e7b', 800),
  sub: u('1518770660439-4636190af475', 600)
}

export const whyChoose = {
  main: u('1581092160562-40aa08e78837', 900),
  sub: u('1526374965328-7f61d4dc18c5', 600)
}

export const projects = [
  { image: u('1526374965328-7f61d4dc18c5', 900), title: 'Smart Home Controller Repair', subtitle: 'Advanced home automation module rebuild' },
  { image: u('1518770660439-4636190af475', 900), title: 'Laptop Logic Board Service', subtitle: 'Precision diagnostics and component swap' },
  { image: u('1518360195198-c65d8f1b8df0', 900), title: 'Industrial Control Unit Fix', subtitle: 'Factory panel repair with rapid turnaround' },
  { image: u('1519400191817-8f3ef61d7843', 900), title: 'Power Supply Retrofit', subtitle: 'Custom power service for critical systems' },
  { image: u('1498050108023-c5249f4df085', 900), title: 'Circuit Board Refurbishment', subtitle: 'High-precision board repairs and testing' },
  { image: u('1581091222165-e23d12fb21d8', 900), title: 'Mobile Screen Replacement', subtitle: 'Crystal-clear display restoration' }
]

export const services = [
  { image: u('1511707171634-5f897ff02aa9', 600), title: 'Phone Repair' },
  { image: u('1496181133206-80ce9b893a6a', 600), title: 'Laptop Repair' },
  { image: u('1558618666-fcd25c85f82e', 600), title: 'Appliance Repair' },
  { image: u('1550751827-4bd374c3d586', 600), title: 'Diagnostics' }
]

export const serviceSlider = [
  { image: u('1581092160562-40aa08e78837', 400), title: 'Hardware Update Service' },
  { image: u('1511707171634-5f897ff02aa9', 400), title: 'Tablets & iPad Services' },
  { image: u('1498050108023-c5249f4df085', 400), title: 'Laptop & Desktop Repair' },
  { image: u('1550751827-4bd374c3d586', 400), title: 'Software Installation' },
  { image: u('1558618666-fcd25c85f82e', 400), title: 'Data Recovery' }
]

export const testimonials = [
  { avatar: u('1438761681033-6461ffad8d80', 100), name: 'Aisha Khan' },
  { avatar: u('1507003211169-0a1dd7228f2d', 100), name: 'Rohit Patel' },
  { avatar: u('1472099645785-5658abf4ff4e', 100), name: 'Sanjay Mehta' }
]

export const sliderBg = u('1581092160562-40aa08e78837', 1200)
