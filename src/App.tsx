import { DisplaySheet } from "./components/DisplaySheet";
import { Sheet } from "./models";

function App() {
  const sheet = new Sheet<number>();

  const printSheet = () => {
    console.log(sheet);
  };

  return (
    <div className="h-full w-full flex flex-col">
      <button className="h-[5%]" onClick={printSheet}>
        Print Sheet
      </button>
      <DisplaySheet sheet={sheet} />
    </div>
  );
}
export default App;
