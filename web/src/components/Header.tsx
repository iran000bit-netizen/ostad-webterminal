type HeaderProps = { onDeposit: () => void };

export function Header({ onDeposit }: HeaderProps) {
  return (
    <header>
      <div className="brand">
        <strong>استاد</strong>
        <div>
          <b>Ostad WebTerminal</b>
          <small>WebTerminal MT4-style</small>
        </div>
      </div>
      <nav>
        <a href="#">OPEN ACCOUNT</a>
        <a
          href="#"
          onClick={(event) => {
            event.preventDefault();
            onDeposit();
          }}
        >
          DEPOSIT
        </a>
        <a href="#">SUPPORT</a>
      </nav>
    </header>
  );
}
