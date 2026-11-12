import {createContext, useContext, useRef, useState, useEffect} from 'react';
import type {ReactNode} from 'react';
import {Link} from 'react-router-dom';
import {useLibrary} from '../lib/data';
import {Icon} from './Icon';

const Context = createContext<() => void>(() => {});
export const useCloud = () => useContext(Context);

function Dialog({close}: {close: () => void}) {
  const {config} = useLibrary();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    ref.current?.showModal();
    return () => trigger?.focus();
  }, []);
  return (
    <dialog ref={ref} className="cloud-dialog" onCancel={close} onClick={e => e.target === e.currentTarget && close()} aria-labelledby="cloud-heading">
      <button className="icon-button close-button" onClick={close} aria-label="Close">
        <Icon name="close" />
      </button>
      <p className="eyebrow">Add to pCloud</p>
      <h2 id="cloud-heading">You’ll finish this on pCloud.</h2>
      <ol className="dialog-steps">
        <li><span>1</span>The shared folder opens in a new tab.</li>
        <li><span>2</span>Use pCloud’s <strong>save to my account</strong> action and sign in there. You need about 3 GB free.</li>
        <li><span>3</span>Come back and connect Odin — saving the files does not install any pack yet.</li>
      </ol>
      <div className="actions">
        <a className="button" href={config.shareUrl} target="_blank" rel="noopener noreferrer" onClick={close}>
          Continue to pCloud <Icon name="external" size={16} />
        </a>
        <Link className="button ghost" to="/guide?path=cloud&step=3" onClick={close}>Read the guide first</Link>
      </div>
      <p className="small muted">This website never sees your pCloud account or password.</p>
    </dialog>
  );
}

export function CloudProvider({children}: {children: ReactNode}) {
  const [open, setOpen] = useState(false);
  return (
    <Context.Provider value={() => setOpen(true)}>
      {children}
      {open ? <Dialog close={() => setOpen(false)} /> : null}
    </Context.Provider>
  );
}
