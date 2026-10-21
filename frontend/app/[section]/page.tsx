import Home from '../page';

const appSections = ['login', 'register', 'my-claims', 'new-claim', 'reviews', 'profile'];

export function generateStaticParams() {
  return appSections.map((section) => ({ section }));
}

export const dynamicParams = false;

export default Home;
