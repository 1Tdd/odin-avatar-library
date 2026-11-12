import {useEffect, useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {issues, faqs} from '../content/help';
import {Icon} from '../components/Icon';

export default function Help() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const visible = issues.filter(x => `${x.label} ${x.symptom} ${x.causes} ${x.checks.join(' ')}`.toLowerCase().includes(q));
  const visibleFaqs = faqs.filter(([question, answer]) => `${question} ${answer}`.toLowerCase().includes(q));
  const current = visible.find(x => x.id === params.get('issue')) || visible[0];

  useEffect(() => {
    document.title = 'Troubleshooting & FAQ — Odin Avatar Library';
  }, []);

  return (
    <section className="page help-page">
      <header className="page-head">
        <p className="eyebrow">Help</p>
        <h1>Let’s get you unstuck.</h1>
        <p className="page-intro">Start with what you see. Keep your backup until the fix works.</p>
      </header>
      <div className="search-field">
        <Icon name="search" />
        <input type="search" aria-label="Search troubleshooting and FAQ" placeholder="Search an error or symptom…" value={query} onChange={e => setQuery(e.target.value)} />
      </div>

      {current ? (
        <div className="help-layout">
          <nav className="issue-nav" aria-label="Troubleshooting issues">
            {visible.map(x => (
              <button key={x.id} className={current.id === x.id ? 'is-active' : ''} aria-current={current.id === x.id ? 'page' : undefined} onClick={() => setParams({issue: x.id}, {replace: true})}>
                {x.label}
              </button>
            ))}
          </nav>
          <article className="issue-content" key={current.id}>
            <h2>{current.symptom}</h2>
            <p className="muted">{current.causes}</p>
            <div className="issue-columns">
              <section>
                <h3><Icon name="search" size={18} /> Check first</h3>
                <ol>{current.checks.map(x => <li key={x}>{x}</li>)}</ol>
              </section>
              <section>
                <h3><Icon name="check" size={18} /> Recover safely</h3>
                <ol>{current.recovery.map(x => <li key={x}>{x}</li>)}</ol>
              </section>
            </div>
          </article>
        </div>
      ) : !visibleFaqs.length ? (
        <div className="empty-state">
          <h2>No matching answers.</h2>
          <p>Try “images”, “loading”, “connect” or “ZIP”.</p>
          <button className="button ghost" onClick={() => setQuery('')}>Clear search</button>
        </div>
      ) : null}

      <aside className="help-request" aria-label="Requests and corrections">
        <p>A name is wrong, an image is broken or a show is missing?</p>
        <Link className="button ghost" to="/request">Send a request <Icon name="arrow" size={18} /></Link>
      </aside>

      {visibleFaqs.length ? (
        <section className="section flush faq">
          <header className="section-head"><h2>Frequently asked</h2></header>
          {visibleFaqs.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}<Icon name="chevron" size={18} /></summary>
              <p>{answer}</p>
            </details>
          ))}
        </section>
      ) : null}

      <div className="callout">
        <div>
          <h2>Starting over?</h2>
          <p>The installation guide walks through every step, from the files to the profile picture.</p>
        </div>
        <Link className="button" to="/guide">Open the guide <Icon name="arrow" size={18} /></Link>
      </div>
    </section>
  );
}
