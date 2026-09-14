import { PartnerDetail } from '../../partners/_components/PartnerDetail';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PartnerDetail kind="SCHOOL" id={id} />;
}
