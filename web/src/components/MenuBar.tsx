type MenuBarProps = { onLogin: () => void; onLogout: () => void };

const menus = ['View', 'Insert', 'Charts', 'Options', 'Help'];

export function MenuBar({ onLogin, onLogout }: MenuBarProps) {
  return (
    <div className="menu">
      <details>
        <summary>File</summary>
        <div className="menu-dropdown">
          <button onClick={onLogin}>Login to Trade Account</button>
          <button onClick={onLogout}>Logout</button>
        </div>
      </details>
      {menus.map((menu) => (
        <details key={menu}>
          <summary>{menu}</summary>
          <div className="menu-dropdown">
            <button disabled>{menu} options</button>
          </div>
        </details>
      ))}
      <b>Ostad Terminal</b>
    </div>
  );
}
