import ClientManager from '../ClientManager';

export const metadata = { title: 'Clients & Branches – Admin Panel' };

export default function ClientsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Clients & Branches</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage service contracts, enterprise clients, and their branch locations.
        </p>
      </div>
      <ClientManager />
    </div>
  );
}

