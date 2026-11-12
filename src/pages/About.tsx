import {useEffect} from 'react';
import {Link} from 'react-router-dom';
import {useLibrary} from '../lib/data';
import {formatCount} from '../lib/pcloud';
import {Icon} from '../components/Icon';

export default function About() {
  const {catalog} = useLibrary();
  useEffect(() => {
    document.title = 'About the Library — Odin Avatar Library';
  }, []);
  return (
    <section className="page prose-page">
      <header className="page-head">
        <p className="eyebrow">About</p>
        <h1>A world of characters.</h1>
        <p className="page-intro">An unofficial community collection of {formatCount(catalog.imageCount)} pictures for personalising your Odin profiles.</p>
      </header>
      <div className="prose-grid">
        <section>
          <h2>Find a picture that feels like you</h2>
          <p>Explore characters from film, television, anime and games. Browse by platform, search for a favourite character, and choose a classic portrait or an animated avatar.</p>
          <p>Collect individual packs into your own selection, or take the complete library. The installation guide covers saving the files and adding packs in Odin.</p>
        </section>
        <section>
          <h2>Made for browsing</h2>
          <p>Small thumbnails keep the catalog light. Animations play only when you ask for a preview. Descriptive labels help with pictures whose character identity is not confirmed.</p>
        </section>
        <section>
          <h2>Your library, on your storage</h2>
          <p>Images and downloads are served by pCloud. Save a copy to your account, or download the files and upload them to any WebDAV storage. Odin then reads the packs from there.</p>
          <p>This website never asks for your password or storage credentials, and uses no analytics or advertising scripts. Your pack selection is kept only in your browser.</p>
        </section>
        <section>
          <h2>Independent community project</h2>
          <p>This project is not affiliated with, endorsed by or operated by Odin, pCloud, or the owners of any depicted characters. Artwork and trademarks belong to their respective owners.</p>
        </section>
      </div>
      <div className="actions">
        <Link className="button" to="/packs">Explore packs <Icon name="arrow" size={18} /></Link>
        <Link className="button ghost" to="/guide">Installation guide</Link>
      </div>
    </section>
  );
}
