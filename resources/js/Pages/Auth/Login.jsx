import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword, intendedRole }) {
    const lockedRole = ['student', 'supervisor', 'industry'].includes(intendedRole)
        ? intendedRole
        : null;

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
        selected_role: lockedRole || 'student',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            <div className="mb-5">
                <h1 className="sr-section-title text-slate-900 dark:text-slate-100">{
                    'Sign in'
                }</h1>
                <p className="sr-muted mt-1">Access your Smart R&D workspace.</p>
            </div>

            {status && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="sr-section-stack">
                <div>
                    <InputLabel htmlFor="selected_role" value="Role" />
                    <select
                        id="selected_role"
                        value={data.selected_role}
                        onChange={(e) => setData('selected_role', e.target.value)}
                        disabled={Boolean(lockedRole)}
                        className={`mt-1 sr-field ${
                            lockedRole ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'
                        }`}
                    >
                        <option value="student">Student</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="industry">Industry</option>
                    </select>
                    {lockedRole && (
                        <p className="mt-1 text-xs text-gray-500">
                            This login is locked for the selected role.
                        </p>
                    )}
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        isFocused={true}
                        onChange={(e) => setData('email', e.target.value)}
                    />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value="Password" />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-2 block">
                    <label className="flex items-center">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) =>
                                setData('remember', e.target.checked)
                            }
                        />
                        <span className="ms-2 text-sm text-gray-600">
                            Remember me
                        </span>
                    </label>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Forgot your password?
                        </Link>
                    )}

                    <PrimaryButton className="!ms-0 sr-btn-action-primary w-auto px-5" disabled={processing}>
                        Log in
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
