import NavLink from './NavLink.jsx'

export default function Footer() {
  return (
    <footer className="react-footer">
      <div className="container">
        <div className="row gy-5">
          <div className="col-xl-4 col-md-6">
            <NavLink to="/" className="react-footer__logo"><img src="/assets/img/logo/logo-white.png" alt="Mindu" /></NavLink>
            <p>Discover a diverse range of faculties and courses designed to nurture practical skills, curiosity and lifelong learning.</p>
            <div className="react-footer__social" aria-label="Social links">
              <a href="#facebook" aria-label="Facebook"><i className="fa-brands fa-facebook-f" /></a>
              <a href="#x" aria-label="X"><i className="fa-brands fa-x-twitter" /></a>
              <a href="#youtube" aria-label="YouTube"><i className="fa-brands fa-youtube" /></a>
              <a href="#instagram" aria-label="Instagram"><i className="fa-brands fa-instagram" /></a>
            </div>
          </div>
          <div className="col-xl-2 col-md-6">
            <h3>Explore</h3>
            <NavLink to="/about">About us</NavLink>
            <NavLink to="/courses">Courses</NavLink>
            <NavLink to="/team">Our team</NavLink>
            <NavLink to="/blog">Latest news</NavLink>
          </div>
          <div className="col-xl-2 col-md-6">
            <h3>Support</h3>
            <NavLink to="/faq">Help &amp; FAQ</NavLink>
            <NavLink to="/contact">Contact</NavLink>
            <NavLink to="/login">Sign in</NavLink>
            <NavLink to="/register">Register</NavLink>
          </div>
          <div className="col-xl-4 col-md-6">
            <h3>Subscribe to our newsletter</h3>
            <p>Learning ideas, new courses and Mindu updates in your inbox.</p>
            <form className="react-footer__form" onSubmit={(event) => event.preventDefault()}>
              <label className="visually-hidden" htmlFor="newsletter-email">Email address</label>
              <input id="newsletter-email" type="email" placeholder="Email address" required />
              <button type="submit" aria-label="Subscribe"><i className="fa-regular fa-arrow-right" /></button>
            </form>
          </div>
        </div>
        <div className="react-footer__bottom">
          <span>© {new Date().getFullYear()} Mindu. All rights reserved.</span>
          <div><a href="#privacy">Privacy policy</a><a href="#terms">Terms of use</a></div>
        </div>
      </div>
    </footer>
  )
}
