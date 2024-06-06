document.getElementById('add-asset-button').addEventListener('click', function() {
    let selectedAsset = document.getElementsByName('asset_name_2')[0].value;
    let processSelect = document.getElementById('process-select');
    let selectedProcess = processSelect.options[processSelect.selectedIndex].text;
    function showModal(modalId) {
        var modal = document.getElementById(modalId);
        modal.style.display = "block";
    }
    function closeModal(modalId) {
        var modal = document.getElementById(modalId);
        modal.style.display = "none";
    }
    var closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(function(button) {
        button.onclick = function() {
            var modal = button.closest('.modal');
            closeModal(modal.id);
        }
    });
    window.onclick = function(event) {
        var modals = document.querySelectorAll('.modal');
        modals.forEach(function(modal) {
            if (event.target == modal) {
                closeModal(modal.id);
            }
        });
    }
    fetch('/add-asset', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ asset: selectedAsset, process_name: selectedProcess }),
    }).then(response => {
        if (response.status === 409) {
            showModal(conflictModal);
        } else if (response.ok) {
            location.reload();
            showModal(successModal);
        } else {
            alert('An error occurred. Please try again.');
        }
    });
});

document.getElementById('process-select').addEventListener('change', function() {
    var selectedOption = this.options[this.selectedIndex];
    window.location.href = selectedOption.value;
});

document.getElementById('asset-button').addEventListener('click', function() {
    let selectedTable = document.getElementById('table-select').value;
    fetch('/get-data/'+ selectedTable)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(responseData => {
            console.log(responseData);  
            const { colnames, data } = responseData;
            if (!Array.isArray(data) || !data.every(Array.isArray)) {
                console.error('Expected data to be an array of arrays but got:', data);
                return;
            }

            let tableHead = document.getElementById('table-head');
            let tableBody = document.getElementById('table-body');
            
            tableHead.innerHTML = '';
            tableBody.innerHTML = '';
            let headerRow = document.createElement('tr');
            colnames.forEach(colname => {
                let th = document.createElement('th');
                th.innerHTML = colname;
                headerRow.appendChild(th);
            });
            tableHead.appendChild(headerRow);
            data.forEach(row => {
                let tr = document.createElement('tr');
                row.forEach(cell => {
                    let td = document.createElement('td');
                    td.innerHTML = cell;
                    tr.appendChild(td);
                });
                tableBody.appendChild(tr);
            });
        })
        .catch(error => {
            console.error('Error:', error);
        });
});