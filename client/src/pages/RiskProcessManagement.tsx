import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { jwtDecode } from 'jwt-decode';

interface ProcessData {
  processID: string;
  assetID: string;
  description: string;
  status: string;
  proof: string;
}
interface MyPayload {
  identity: string;
  role: string;
  
}

interface Props {
  process_names: string[];
  selectedProcess: string;
  process_data: ProcessData[];
  asset_list: string[];
  asset_names: string[];
  table_names: string[];
}

interface TableData {
  colnames: string[];
  data: any[][];
}

const RiskProcessManagement: React.FC = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [Sdata, setSData] = useState<Props | null>(null);
  const [processData, setProcessData] = useState<Props | null>(null);
  const [selectedProcess, setSelectedProcess] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<TableData>({ colnames: [], data: [] });
  const [modalMessage, setModalMessage] = useState<string>('');
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  useEffect(() => {
    // Check if a token exists in local storage
    const token = localStorage.getItem('token');
    
    if (token) {
      // Check if the token has three parts
      const parts = token.split('.');
      if (parts.length === 3) {
        // Decode the token to extract user role
        const decodedToken = jwtDecode<MyPayload>(token);
        console.log(decodedToken);
        const role = decodedToken.role;
        console.log(role);
        setUserRole(role);
      } else {
        console.error('Invalid token format');
      }
    } else {
      // Redirect to login if no token is found
      console.error('No token found');
    }
  }, []);

  useEffect(() => {
    fetch('http://localhost:5000/')
      .then(response => response.json())
      .then(data => setSData(data))
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable);
    }
  }, [selectedTable]);

  const fetchTableData = async (table: string) => {
    try {
      const result = await axios.get<TableData>(`http://localhost:5000/get-data/${table}`);
      if (result.data) {
        setTableData(result.data);
      }
    } catch (error) {
      console.error('Error fetching table data:', error);
    }
  };

  const GotoUser = async () => {
    window.location.href = "/users";
  };

  const fetchProcessData = async (process: string) => {
    try {
      const result = await axios.get<Props>(`http://localhost:5000/process/${process}`);
      if (result.data) {
        setProcessData(result.data);
      }
    } catch (error) {
      console.error('Error fetching process data:', error);
    }
  };
  console.log(processData);

  const handleProcessChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const processName = e.target.value;
    fetchProcessData(processName);
    setSelectedProcess(processName);
  };

  const handleAddAsset = async () => {
    const selectedAsset = (document.getElementsByName('asset_name_2')[0] as HTMLSelectElement).value;
    const processSelect = document.getElementById('process-select') as HTMLSelectElement;
    const processName = processSelect.options[processSelect.selectedIndex].text;
  
    // Get the token from local storage
    const token = localStorage.getItem('token');
  
    try {
      const response = await fetch('http://localhost:5000/add-asset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add the token to the Authorization header
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ asset: selectedAsset, process_name: processName }),
      });
  
      if (response.status === 409) {
        setModalMessage('This process already has the selected asset.');
      } else if (response.ok) {
        setModalMessage('The selected asset is added.');
        window.location.reload();
      } else {
        setModalMessage('An error occurred. Please try again.');
      }
      setModalVisible(true);
    } catch (error) {
      console.error('Error adding asset:', error);
      setModalMessage('An error occurred. Please try again.');
      setModalVisible(true);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  // Render loading state if Sdata is null
  if (Sdata === null) {
    return <div>Loading...</div>;
  }

  const {
    process_names = [],
    process_data = [],
    asset_list = [],
    asset_names = [],
    table_names = [],
  } = Sdata;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between mb-3">
        <a href="/" className="btn btn-primary">
          RESET
        </a>
        <select
          id="process-select"
          className="form-control w-50"
          onChange={handleProcessChange}
          value={selectedProcess}
        >
          <option value="">Select Process</option>
          {process_names.map((processName) => (
            <option key={processName} value={processName}>
              {processName}
            </option>
          ))}
        </select>
      </div>
      {userRole === 'admin' && (
        <div className="input-group">          
            <button type="button" className="btn btn-success" onClick={GotoUser}>
              Show All users
            </button>
        </div>

      )}


      <table className="table table-bordered">
        <thead>
          <tr>
            <th>ProcessID</th>
            <th>AssetID</th>
            <th>Description</th>
            <th>Status</th>
            <th>Proof</th>
            <th>Asset List</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{processData?.process_data[0]}</td>
            <td>{processData?.process_data[1]}</td>
            <td>{processData?.process_data[2]}</td>
            <td>{processData?.process_data[3]}</td>
            <td>{processData?.process_data[4]}</td>
            <td>
              <ul>
                {processData?.asset_list.map((asset, index) => (
                  <li key={index}>{asset}</li>
                ))}
              </ul>
              {userRole === 'admin' && (
              <div className="input-group">
                <select name="asset_name_2" className="form-control">
                  {processData?.asset_names.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                <div className="input-group-append">
                  <button type="button" id="add-asset-button" className="btn btn-success" onClick={handleAddAsset}>
                    Add asset
                  </button>
                </div>
              </div>
            )}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="form-group">
        <label htmlFor="table-select">Select Table:</label>
        <select id="table-select" className="form-control" onChange={(e) => setSelectedTable(e.target.value)}>
          <option value="">Select Table</option>
          {table_names.map((table) => (
            <option key={table} value={table}>
              {table}
            </option>
          ))}
        </select>
      </div>
      <button id="asset-button" className="btn btn-info" onClick={() => fetchTableData(selectedTable)}>
        Get Data
      </button>
      <table id="data-table" className="table table-striped mt-3">
        <thead id="table-head">
          <tr>
            {tableData.colnames.map((colname: string) => (
              <th key={colname}>{colname}</th>
            ))}
          </tr>
        </thead>
        <tbody id="table-body">
          {tableData.data.map((row: any[], index: number) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {modalVisible && (
        <div id="conflictModal" className="modal" style={{ display: 'block' }}>
          <div className="modal-content ">
            <button className="close" onClick={closeModal}>
              &times;
            </button>
            <p>{modalMessage}</p>
          </div>
        </div>
      )}
    </div>

  );

};


export default RiskProcessManagement;
