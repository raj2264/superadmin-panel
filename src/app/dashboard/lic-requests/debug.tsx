"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function LICRequestsDebug() {
  const [tables, setTables] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [licTable, setLicTable] = useState<any>(null);
  const [residentsTable, setResidentsTable] = useState<any>(null);

  useEffect(() => {
    async function checkDatabaseStructure() {
      try {
        // First, list all tables
        const { data: tableData, error: tableError } = await supabase
          .from('pg_catalog.pg_tables')
          .select('tablename')
          .eq('schemaname', 'public');
        
        if (tableError) throw tableError;
        setTables(tableData.map(t => t.tablename));
        
        // Check lic_requests table
        const { data: licData, error: licError } = await supabase
          .from('lic_requests')
          .select('*')
          .limit(1);
          
        if (licError) throw licError;
        setLicTable(licData);
        
        // Check residents table
        const { data: residentData, error: residentError } = await supabase
          .from('residents')
          .select('*')
          .limit(1);
        
        if (residentError) throw residentError;
        setResidentsTable(residentData);
        
      } catch (err: any) {
        setError(err.message || JSON.stringify(err));
      }
    }
    
    checkDatabaseStructure();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Database Debug Info</h1>
      
      {error && (
        <div className="bg-red-100 p-4 mb-6 rounded">
          <h2 className="font-bold">Error:</h2>
          <pre className="whitespace-pre-wrap">{error}</pre>
        </div>
      )}
      
      <div className="mb-6">
        <h2 className="font-bold mb-2">Tables in Database:</h2>
        <ul className="list-disc pl-5">
          {tables.map(table => (
            <li key={table}>{table}</li>
          ))}
        </ul>
      </div>
      
      <div className="mb-6">
        <h2 className="font-bold mb-2">LIC Requests Table Sample:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
          {JSON.stringify(licTable, null, 2)}
        </pre>
      </div>
      
      <div className="mb-6">
        <h2 className="font-bold mb-2">Residents Table Sample:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
          {JSON.stringify(residentsTable, null, 2)}
        </pre>
      </div>
    </div>
  );
} 
