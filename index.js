<!DOCTYPE html>
<html>
<body>
    <h2>Issue Certificate</h2>
    <input id="id" placeholder="ID"><input id="name" placeholder="Name">
    <button onclick="issue()">Issue</button>
    
    <h2>Verify Certificate</h2>
    <input id="vId" placeholder="Enter ID">
    <button onclick="verify()">Verify</button>
    <pre id="result"></pre>

    <script>
        async function issue() {
            const data = { id: document.getElementById('id').value, name: document.getElementById('name').value, course: "Blockchain", issuer: "NCVET", date: "2026-03-23" };
            await fetch('http://localhost:3000/issue', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
            alert("Done");
        }
        async function verify() {
            const id = document.getElementById('vId').value;
            const res = await fetch(`http://localhost:3000/verify/${id}`);
            const json = await res.json();
            document.getElementById('result').innerText = JSON.stringify(json, null, 2);
        }
    </script>
</body>
</html>
