import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Layout from './components/Layout';
import Documents from './pages/Documents';
import Parsed from './pages/Parsed';
import Attributes from './pages/Attributes';
import Products from './pages/Products';

const views = {
  documents: Documents,
  parsed: Parsed,
  attributes: Attributes,
  products: Products,
};

function App() {
  const [view, setView] = useState('documents');
  const ViewComponent = views[view] || Documents;
  return (
    <Layout currentView={view} setView={setView}>
      <ViewComponent />
    </Layout>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
