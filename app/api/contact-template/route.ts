import * as XLSX from 'xlsx';

/**
 * Streams a ready-to-fill Excel template for the contacts importer.
 * Columns match what the aggressive importer understands. The two sample rows
 * show the expected shape (and are themselves valid contacts).
 */
export async function GET() {
  const headers = [
    'Full Name',
    'Phone',
    'Email',
    'Relation',
    'Student Name',
  ];

  const sample = [
    {
      'Full Name': 'Asha Mwita',
      Phone: '+255712345678',
      Email: 'asha.mwita@example.com',
      Relation: 'Mother',
      'Student Name': 'Brian Mwita',
    },
    {
      'Full Name': 'John Doe',
      Phone: '0784000111',
      Email: 'john.doe@example.com',
      Relation: 'Father',
      'Student Name': 'Grace Doe',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sample, { header: headers });
  ws['!cols'] = [
    { wch: 24 },
    { wch: 18 },
    { wch: 28 },
    { wch: 14 },
    { wch: 24 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Contacts');

  const buf = XLSX.write(wb, {
    type: 'buffer',
    bookType: 'xlsx',
  }) as Buffer;

  return new Response(new Uint8Array(buf), {
    status: 200,
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition':
        'attachment; filename="ypit-contacts-template.xlsx"',
      'Cache-Control': 'no-store',
    },
  });
}
