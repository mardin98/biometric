import React, { useState, useMemo } from 'react';
import axios from '../config/axios';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileSpreadsheet, Download, Search, AlertCircle, Filter, FileText } from 'lucide-react';


const ReportsView = () => {
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [searched, setSearched] = useState(false);
    const [filterText, setFilterText] = useState('');
    const [error, setError] = useState(null);

    // Lógica de filtrado en tiempo real (Plus: Búsqueda dinámica)
    const filteredData = useMemo(() => {
        if (!filterText) return reportData;

        const lowerFilter = filterText.toLowerCase();
        return reportData.filter(item =>
            // Busca en nombre de usuario, cargo o DUI
            (item.usuario?.toLowerCase().includes(lowerFilter)) ||
            (item.cargo?.toLowerCase().includes(lowerFilter)) ||
            (item.dui?.toLowerCase().includes(lowerFilter)) ||
            (item.metodo?.toLowerCase().includes(lowerFilter))
        );
    }, [filterText, reportData]);

    const handlePreview = async () => {
        if (!fechaInicio || !fechaFin) return alert("Selecciona un rango de fechas");

        setLoading(true);
        setError(null);
        setReportData([]);
        setSearched(false);

        try {
            // Nota: Se recomienda usar el interceptor de axios configurado previamente
            const res = await axios.get(`/dashboard/reporte-detallado`, {
                params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
            });
            setReportData(res.data);
            setSearched(true);
        } catch (error) {
            console.error("Error cargando reporte", error);
            setError("No se pudieron obtener los datos. Verifique la conexión con el servidor.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = () => {
        if (filteredData.length === 0) return alert("No hay datos para exportar");

        const doc = new jsPDF();

        // Título y encabezado profesional
        doc.setFontSize(18);
        doc.text("Reporte de Asistencia Biométrica", 14, 22);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Rango: ${fechaInicio} al ${fechaFin}`, 14, 30);
        doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 36);

        // Preparar columnas y filas
        const tableColumn = Object.keys(filteredData[0]).map(key => key.replace(/_/g, ' '));
        const tableRows = filteredData.map(item => Object.values(item));

        // LLAMADA CORREGIDA:
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 45,
            theme: 'striped',
            headStyles: { fillColor: [37, 99, 235] }, // Azul profesional
            styles: { fontSize: 8 },
            margin: { top: 45 }
        });

        doc.save(`Reporte_Asistencia_${fechaInicio}_al_${fechaFin}.pdf`);
    };

    const handleDownloadExcel = () => {
        if (filteredData.length === 0) return alert("No hay datos para exportar");
        const ws = XLSX.utils.json_to_sheet(filteredData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Reporte_Filtrado");
        XLSX.writeFile(wb, `Reporte_Biometrico_${fechaInicio}_al_${fechaFin}.xlsx`);
    };

    const handleDownloadCSV = () => {
        if (filteredData.length === 0) return alert("No hay datos para exportar");
        const ws = XLSX.utils.json_to_sheet(filteredData);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Reporte_${fechaInicio}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-8 h-full flex flex-col animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2 shrink-0">
                <FileSpreadsheet className="text-emerald-600" /> Centro de Reportes
            </h2>

            {/* BARRA DE FILTROS Y BÚSQUEDA */}
            <div className="bg-white p-6 rounded-3xl border shadow-sm flex flex-wrap items-end gap-4 shrink-0 mb-6">
                <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase ml-1">Fecha Inicial</label>
                    <input
                        type="date"
                        className="p-2.5 border rounded-xl outline-none focus:ring-2 ring-blue-500/20 text-slate-600 bg-slate-50"
                        value={fechaInicio}
                        onChange={e => setFechaInicio(e.target.value)}
                    />
                </div>
                <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase ml-1">Fecha Final</label>
                    <input
                        type="date"
                        className="p-2.5 border rounded-xl outline-none focus:ring-2 ring-blue-500/20 text-slate-600 bg-slate-50"
                        value={fechaFin}
                        onChange={e => setFechaFin(e.target.value)}
                    />
                </div>

                <button
                    onClick={handlePreview}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-blue-200"
                >
                    {loading ? "Procesando..." : <><Search size={18} /> Cargar Datos</>}
                </button>

                {/* PLUS: Buscador dinámico que solo aparece si hay datos */}
                {reportData.length > 0 && (
                    <div className="flex-1 min-w-[250px] relative animate-in zoom-in-95">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Filtrar resultados</label>
                        <div className="relative">
                            <Filter className="absolute left-3 top-3 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar nombre, cargo o DUI..."
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl outline-none focus:ring-2 ring-emerald-500/20 text-sm"
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {filteredData.length > 0 && (
                    <div className="flex gap-2 ml-auto">
                        <button
                            onClick={handleDownloadPDF}
                            title="Exportar PDF"
                            className="bg-red-500 hover:bg-red-600 text-white p-2.5 rounded-xl transition-colors shadow-md shadow-red-100"
                        >
                            <FileText size={20} />
                        </button>
                        <button onClick={handleDownloadExcel} title="Exportar Excel" className="bg-emerald-500 hover:bg-emerald-600 text-white p-2.5 rounded-xl transition-colors shadow-md shadow-emerald-100">
                            <FileSpreadsheet size={20} />
                        </button>
                        <button onClick={handleDownloadCSV} title="Exportar CSV" className="bg-slate-700 hover:bg-slate-800 text-white p-2.5 rounded-xl transition-colors shadow-md shadow-slate-200">
                            <Download size={20} />
                        </button>
                    </div>
                )}
            </div>

            {/* TABLA DE PREVISUALIZACIÓN */}
            <div className="flex-1 bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col min-h-0">
                <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-slate-700 text-xs uppercase tracking-widest">Vista Previa del Reporte</h3>
                    <div className="flex gap-4">
                        {filterText && (
                            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                                Filtrando: {filteredData.length} de {reportData.length}
                            </span>
                        )}
                        <span className="text-xs text-slate-400 font-mono">
                            {reportData.length} total registros
                        </span>
                    </div>
                </div>

                <div className="overflow-auto flex-1">
                    {error ? (
                        <div className="h-full flex flex-col items-center justify-center text-red-500 p-8 text-center">
                            <AlertCircle size={40} className="mb-2" />
                            <p className="font-medium">{error}</p>
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
                            <Search size={48} className="mb-4 opacity-20" />
                            <p className="text-sm font-medium">
                                {searched ? "No se encontraron coincidencias." : "Seleccione un rango y presione 'Cargar Datos'."}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse text-sm">
                            <thead className="bg-slate-50 sticky top-0 z-10 text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b">
                                <tr>
                                    {Object.keys(filteredData[0]).map((key) => (
                                        <th key={key} className="px-6 py-4">{key.replace(/_/g, ' ')}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                                        {Object.values(row).map((val, i) => (
                                            <td key={i} className="px-6 py-4 text-slate-600 whitespace-nowrap group-hover:text-slate-900">
                                                {/* Formateo dinámico para booleanos o estados */}
                                                {val === true ? <span className="text-green-600 font-bold text-xs">SÍ</span> :
                                                    val === false ? <span className="text-slate-300 font-bold text-xs">NO</span> :
                                                        String(val)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportsView;