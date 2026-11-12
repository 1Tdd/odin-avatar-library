import React, {Suspense, lazy} from 'react';
import ReactDOM from 'react-dom/client';
import {BrowserRouter, Routes, Route, Link} from 'react-router-dom';
import {LibraryProvider} from './lib/data';
import {SelectionProvider} from './lib/selection';
import {CloudProvider} from './components/CloudDialog';
import {Layout} from './components/Layout';
import Home from './pages/Home';
import '@fontsource-variable/inter';
import '@fontsource/instrument-serif/latin-400-italic.css';
import './styles.css';

const Catalog = lazy(() => import('./pages/Catalog'));
const PackPage = lazy(() => import('./pages/PackPage'));
const Selection = lazy(() => import('./pages/Selection'));
const Downloads = lazy(() => import('./pages/Downloads'));
const Guide = lazy(() => import('./pages/Guide'));
const Help = lazy(() => import('./pages/Help'));
const About = lazy(() => import('./pages/About'));
const Preview = lazy(() => import('./pages/Preview'));
const Request = lazy(() => import('./pages/Request'));

function NotFound() {
  React.useEffect(() => {
    document.title = 'Page not found — Odin Avatar Library';
  }, []);
  return (
    <section className="page">
      <header className="page-head">
        <p className="eyebrow">404</p>
        <h1>This page is off the map.</h1>
        <p className="page-intro">The pack or page may have moved.</p>
      </header>
      <div className="actions">
        <Link className="button" to="/packs">Explore packs</Link>
        <Link className="button ghost" to="/">Back to the start</Link>
      </div>
    </section>
  );
}

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {failed: boolean}> {
  state = {failed: false};
  static getDerivedStateFromError() {
    return {failed: true};
  }
  render() {
    return this.state.failed ? (
      <main className="startup">
        <h1>Something interrupted the page.</h1>
        <p>Your files have not been changed. Reload to try again.</p>
        <button className="button" onClick={() => location.reload()}>Reload</button>
      </main>
    ) : (
      this.props.children
    );
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <LibraryProvider>
          <SelectionProvider>
            <CloudProvider>
              <Routes>
                <Route element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="packs" element={<Suspense fallback={<Loading />}><Catalog /></Suspense>} />
                  <Route path="packs/:id" element={<Suspense fallback={<Loading />}><PackPage /></Suspense>} />
                  <Route path="selection" element={<Suspense fallback={<Loading />}><Selection /></Suspense>} />
                  <Route path="downloads" element={<Suspense fallback={<Loading />}><Downloads /></Suspense>} />
                  <Route path="guide" element={<Suspense fallback={<Loading />}><Guide /></Suspense>} />
                  <Route path="help" element={<Suspense fallback={<Loading />}><Help /></Suspense>} />
                  <Route path="about" element={<Suspense fallback={<Loading />}><About /></Suspense>} />
                  <Route path="preview" element={<Suspense fallback={<Loading />}><Preview /></Suspense>} />
                  <Route path="request" element={<Suspense fallback={<Loading />}><Request /></Suspense>} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </CloudProvider>
          </SelectionProvider>
        </LibraryProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);

function Loading() {
  return <div className="page page-loading" role="status"><span className="sr-only">Opening this page…</span></div>;
}
