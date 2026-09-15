//insert code here
import Link from "next/link";
import "./navbar.css";

const navLinks = [
  { label: "About", href: "/about/" },
  { label: "FAQs", href: "/faqs/" },
  { label: "Pricing", href: "/packages/" },
  { label: "Gallery", href: "/gallery/" },
  { label: "Register", href: "/register/" },
  { label: "Logout", href: "/logout/" },
  { label: "Login", href: "/login/" },
  { label: "User", href: "/user/" },
];

export default function Navbar() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="site-brand" href="/" aria-label="The Detail Bureau home">
          The Detail Bureau
        </Link>

        <div className="site-header__actions">
          <nav className="site-navigation" aria-label="Main navigation">
            <ul className="site-navigation__list">
              {navLinks.map((link) => (
                <li className="site-navigation__item" key={link.href}>
                  <a className="site-navigation__link" href={link.href}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <a className="header-secondary-link" href="/learn-more/">
            Learn More
          </a>
        </div>
      </div>
    </header>
  );
}