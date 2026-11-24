import A3Game from "./A3Game";

function Play() {
  return (
    <div className="a3-stage h-screen min-h-0 overflow-hidden isolate supports-[height:100svh]:h-svh">
      <h1 className="sr-only">A3 game</h1>
      <A3Game />
    </div>
  );
}

export default Play;

