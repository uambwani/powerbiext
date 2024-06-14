import { useState, useRef } from "react";
import { Nav, Display, QueryInput, Options } from "./components";
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";
import { FiRefreshCw } from "react-icons/fi";
import { FaThumbsUp } from "react-icons/fa";
import Table from "./components/Table";

function App() {
  const [analysis, setAnalysis] = useState("");
  const [displayData, setDisplayedData] = useState("");
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [thumbsUpAnimation, setThumbsUpAnimation] = useState(false);
  const [data, setData] = useState([]);

  // test
  const [responseText, setResponseText] = useState("");
  const [dataFrame, setDataFrame] = useState(null);
  // test

  const inputRef = useRef(null);

  //focus input field using ref
  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // animation
  const handleThumbsUpClick = () => {
    setThumbsUpAnimation(true);
    console.log("Response added to cache");
    setTimeout(() => {
      setThumbsUpAnimation(false);
    }, 1000);
  };

  const handleUserQuery = (e) => {
    e.preventDefault();
    setQuery(e.target.value);
  };

  const handleRunPython = async (query) => {
    setLoading(true);
    // Show "In Progress" toast
    const inProgressToastId = toast.info("Generating Analysis...", {
      autoClose: false,
    });

    setAnalysis("");
    setDisplayedData("");
    setData([]);

    try {
      const response = await fetch("http://127.0.0.1:3001/run-python", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });
      const data = await response.json();
      console.log("Data from Python file:", data);

      if (response.ok) {
        setAnalysis(data.result);

        console.log("type of response", typeof data.result);

        // table
        const parsedData = parseResponse(data.result);
        setData(parsedData);
        // table

        toast.dismiss(inProgressToastId);
        toast.success("Analysis Generated!");
      } else {
        console.error("Error from backend:", data.error);
        toast.error("Error analyzing file. Please try again.");
      }

      setLoading(false);
    } catch (error) {
      console.error("Error running Python file:", error);

      setLoading(false);
      toast.dismiss(inProgressToastId);
      // Show "Error" toast
      toast.error("Error analyzing file. Please try again.");
    }
  };

  function parseResponse(response) {
    if (typeof response !== "string") {
      throw new TypeError("Response is not a string");
    }

    const lines = response.split("\n").filter((line) => line.includes("|"));
    const headerLine = lines.find(
      (line) => line.includes("year") || line.includes("customercode")
    );
    const headers = headerLine.split("|").map((header) => header.trim());

    const data = lines.slice(lines.indexOf(headerLine) + 1).map((line) => {
      const values = line.split("|").map((value) => value.trim());
      return headers.reduce((obj, header, index) => {
        obj[header] = values[index];
        return obj;
      }, {});
    });

    return data;
  }

  return (
    <div className='flex flex-col min-h-screen w-3/5 mx-auto'>
      <Nav />
      {/* Display */}
      <main className='flex-1 p-4 flex mb-4'>
        {loading ? (
          <div className='justify-center items-center m-auto'>
            <ClipLoader color={"#36d7b7"} loading={loading} size={50} />
          </div>
        ) : (
          analysis && (
            <div className='relative flex flex-col items-start space-y-4 w-full'>
              <div className='bg-gray-100 p-4 rounded-lg shadow-md w-full relative'>
                <p className='text-gray-900'>{analysis}</p>
                <div className='absolute -bottom-4 right-2 flex space-x-2'>
                  <button
                    className='px-1 py-1 text-sm flex items-center justify-center transform hover:scale-125 transition-transform'
                    onClick={() => handleRunPython(query)}
                  >
                    <FiRefreshCw size={16} />
                  </button>
                  <button
                    className={`px-1 py-1 text-sm transform hover:scale-125 transition-transform ${
                      thumbsUpAnimation ? "animate-bounce" : ""
                    }`}
                    onClick={handleThumbsUpClick}
                  >
                    <FaThumbsUp />
                  </button>
                </div>
                <Table data={data} />
              </div>
            </div>
          )
        )}
        {/* {loading ? (
          <div className='justify-center items-center m-auto'>
            <ClipLoader color={"#36d7b7"} loading={loading} size={50} />
          </div>
        ) : (
          <Table data={data} />
        )} */}
      </main>
      {/* Display */}
      <div className='border-5 border-red-400s'>
        <footer className='p-4 border-t border-black-300 flex flex-col items-center'>
          <Options setQuery={setQuery} focusInput={focusInput} />
          <div className='w-full flex'>
            <input
              type='text'
              className='flex-grow p-2 border rounded-l'
              placeholder='Type in a query...'
              value={query}
              ref={inputRef}
              onChange={(e) => handleUserQuery(e)}
            />
            <button
              className='p-2 bg-emerald-600 text-white rounded-r'
              onClick={() => handleRunPython(query)}
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-6 w-6'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M14 5l7 7m0 0l-7 7m7-7H3'
                />
              </svg>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
