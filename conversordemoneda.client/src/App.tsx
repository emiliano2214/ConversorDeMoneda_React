import "./App.css";
import ConversionDeMoneda from "./Components/ConversionDeMoneda"; // respeta may�sculas

export default function App(): JSX.Element {
    return (
        <div className="app-root">
            <ConversionDeMoneda />
        </div>
    );
}
