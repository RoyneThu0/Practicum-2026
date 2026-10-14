// The centred, max-width wrapper every section sits in (was .wrap in style.css).
function Container({ className = "", children }) {
  return (
    <div className={`mx-auto w-full max-w-7xl px-4 ${className}`}>
      {children}
    </div>
  );
}

export default Container;
