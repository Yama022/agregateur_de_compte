import { useState } from 'react';
import * as XLSX from 'xlsx';

const ExcelReader = () => {
    const [transactions, setTransactions] = useState([]);
    const [groupedTransactions, setGroupedTransactions] = useState([]);

    // Fonction pour convertir le numéro de date Excel en date lisible
    const excelDateToJSDate = (serial) => {
        const utc_days  = Math.floor(serial - 25569);
        const utc_value = utc_days * 86400;                                        
        const date_info = new Date(utc_value * 1000);

        const formattedDate = 
            date_info.getUTCDate() + '/' + 
            (date_info.getUTCMonth() + 1) + '/' + 
            date_info.getUTCFullYear();
        return formattedDate;
    };

    const handleNumberFormat = (numberValue) => {

            // Vérifier si la valeur est définie et n'est pas null
    if (numberValue === undefined || numberValue === null) {
        return 0; // Ou une autre valeur par défaut que vous jugez appropriée
    }
        // Convertir en chaîne si ce n'est pas déjà le cas
        let numberString = numberValue.toString();
        console.log(numberString);
    
        // Supposons que le "h" est un typo et que vous vouliez le remplacer, 
        // ou convertir une virgule en point pour la conversion en nombre flottant
        numberString = numberString.replace('h', '').replace(',', '.');
    
        // Convertir la chaîne corrigée en un nombre flottant
        let number = parseFloat(numberString);
        return number;
    };

    const reformatDateFR = (dateStr) => {
        // Assumant dateStr est "JJ/MM/AAAA" et vous voulez juste s'assurer qu'elle reste dans ce format
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            let [day, month, year] = parts;
            // Ajoute un zéro devant les jours et mois pour s'assurer du format "DD/MM/YYYY"
            day = day.padStart(2, '0');
            month = month.padStart(2, '0');
            return `${day}/${month}/${year}`;
        }
        return dateStr; // Retourne la chaîne originale si le format n'est pas comme prévu
    };
    
    
    
    

    const handleFile = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, {type: 'binary'});
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws, {header: 1}).slice(1);
    
            let processedTransactions = data.map(row => ({
                Date: excelDateToJSDate(row[0]),
                Libellé: row[2],
                Débit: handleNumberFormat(row[3]),
                isInGrouped: false // Marqueur pour identifier si la transaction est regroupée
            }));
    
            const keywords = [
                "LUXEMBOURG PAYPAL", "AMAZON EU SARL", "AMAZON PAYMENTS",
                "WWW.EMRYSLACARTE", "LUXEMBOURG EBAY", "RUNGIS MAGASIN U STATIO", "HERSTAL VOGGT",
                "F COMMISSION D'INTERVENTION", "F FRAIS PRLV IMP", "PRLV SEPA PAYPAL EUROPE SARL",
                "PRLV SEPA PAYPAL (EUROPE)"
            ];
    
            const grouped = keywords.reduce((acc, keyword) => {
                const filteredTransactions = processedTransactions.filter(t => typeof t.Libellé === 'string' && t.Libellé.includes(keyword));
                const totalDebit = filteredTransactions.reduce((sum, curr) => {
                    curr.isInGrouped = true; // Marquez la transaction comme étant regroupée
                    return sum + curr.Débit;
                }, 0);
    
                if (filteredTransactions.length > 0) {
                    acc.push({
                        Libellé: keyword,
                        TotalDébit: totalDebit
                    });
                }
                return acc;
            }, []);
    
            // Filtrez les transactions qui ne sont pas marquées comme 'isInGrouped'
            const ungroupedTransactions = processedTransactions.filter(t => !t.isInGrouped);
    
            setTransactions(ungroupedTransactions);
            setGroupedTransactions(grouped);
        };
        reader.readAsBinaryString(file);
    };
    

    return (
        <div>
            <input type="file" onChange={handleFile} accept=".xlsx, .xls" />
            <h2>Paiements courants</h2>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Libellé</th>
                        <th>Débit</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions
                        .filter(transaction => !isNaN(transaction.Débit)) // Filtre pour exclure les NaN
                        .map((transaction, index) => (
                            <tr key={index}>
                                <td>{reformatDateFR(transaction.Date)}</td>
                                <td>{transaction.Libellé}</td>
                                <td>{transaction.Débit.toFixed(2).replace('.', ',').split("-")}</td>
                            </tr>
                        ))
                    }
                </tbody>

                    
            </table>
            <h2>Paiements regroupés</h2>
            <table>
                <thead>
                    <tr>
                        <th>Libellé</th>
                        <th>Total Débit</th>
                    </tr>
                </thead>
                <tbody>
                    {groupedTransactions.map((group, index) => (
                        <tr key={index}>
                            <td>{group.Libellé}</td>
                            <td>{group.TotalDébit.toFixed(2).replace('.', ',').split("-")}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ExcelReader;
