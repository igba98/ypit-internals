import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <div className="w-full max-w-md">
      <div className="text-right mb-12">
        <span className="text-xs text-gray-400 font-medium tracking-widest uppercase">YPIT OPS v1.0</span>
      </div>
      <LoginForm />
    </div>
  );
}
