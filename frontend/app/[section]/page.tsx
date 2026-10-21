import Home from '../page';

const dashboardSections = ['my-claims', 'new-claim', 'reviews', 'profile'];

export function generateStaticParams() {
  return dashboardSections.map((section) => ({ section }));
}

export const dynamicParams = false;

export default Home;
