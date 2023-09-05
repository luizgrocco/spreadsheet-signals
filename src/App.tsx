import "./App.css";
import { DisplaySheet } from "./components/DisplaySheet";
import { Sheet } from "./models";

function App() {
  const sheet = new Sheet<number>();

  const printSheet = () => {
    console.log(sheet);
  };

  return (
    <div className="App">
      <button onClick={printSheet}>Print Sheet</button>
      <div>{JSON.stringify(sheet.cells.map((cell) => cell.cellId))}</div>
      <DisplaySheet sheet={sheet} />
    </div>
  );
}
export default App;
