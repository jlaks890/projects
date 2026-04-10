export default function Stars({ n }) {
  return <span className="stars">{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span>;
}
