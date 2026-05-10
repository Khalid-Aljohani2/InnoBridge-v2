import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

export default function GroupsPage({ groups = [], students = [], canCreate = false }) {
    const { isArabic, isDark } = useUiPreferences();
    const { flash } = usePage().props;

    const groupForm = useForm({
        name: '',
        description: '',
        student_ids: [],
    });

    const t = isArabic
        ? {
              title: 'المجموعات والمحادثات الخاصة',
              createTitle: 'إنشاء مجموعة جديدة',
              groupName: 'اسم المجموعة',
              groupDesc: 'وصف مختصر',
              chooseStudents: 'اختر الطلاب',
              createBtn: 'إنشاء المجموعة',
              groupsTitle: 'المجموعات الحالية',
              noGroups: 'لا توجد مجموعات حالياً.',
              members: 'الأعضاء',
              myRole: 'صلاحيتي',
              adminRole: 'Admin',
              memberRole: 'Member',
              latestMessage: 'آخر رسالة',
              openChat: 'دخول المحادثة',
              noMessage: 'لا توجد رسائل بعد.',
          }
        : {
              title: 'Groups & Private Chats',
              createTitle: 'Create New Group',
              groupName: 'Group name',
              groupDesc: 'Short description',
              chooseStudents: 'Choose students',
              createBtn: 'Create Group',
              groupsTitle: 'Current Groups',
              noGroups: 'No groups yet.',
              members: 'Members',
              myRole: 'My role',
              adminRole: 'Admin',
              memberRole: 'Member',
              latestMessage: 'Latest message',
              openChat: 'Open chat',
              noMessage: 'No messages yet.',
          };

    const toggleStudent = (id) => {
        const ids = groupForm.data.student_ids;
        if (ids.includes(id)) {
            groupForm.setData('student_ids', ids.filter((x) => x !== id));
        } else {
            groupForm.setData('student_ids', [...ids, id]);
        }
    };

    return (
        <AuthenticatedLayout header={<h2 className={`font-semibold text-xl ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{t.title}</h2>}>
            <Head title={t.title} />

            <div dir={isArabic ? 'rtl' : 'ltr'} className={`py-8 ${isDark ? 'sr-app-bg-dark' : 'sr-app-bg'}`}>
                <div className="sr-page-shell sr-section-stack">
                    {flash?.success && <div className="rounded-xl bg-green-100 text-green-800 px-4 py-3 text-sm font-semibold">{flash.success}</div>}
                    {flash?.error && <div className="rounded-xl bg-red-100 text-red-800 px-4 py-3 text-sm font-semibold">{flash.error}</div>}

                    {canCreate && (
                        <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-5`}>
                            <h3 className={`sr-subtitle mb-3 ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{t.createTitle}</h3>
                            <form
                                className="space-y-3"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    groupForm.post(route('supervisor.groups.create'));
                                }}
                            >
                                <div>
                                <label className={`mb-1 block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t.groupName}</label>
                                <input
                                    className={`w-full rounded-lg ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                                    placeholder={t.groupName}
                                    value={groupForm.data.name}
                                    onChange={(e) => groupForm.setData('name', e.target.value)}
                                />
                                </div>
                                <div>
                                <label className={`mb-1 block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t.groupDesc}</label>
                                <textarea
                                    className={`w-full rounded-lg ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                                    rows="2"
                                    placeholder={t.groupDesc}
                                    value={groupForm.data.description}
                                    onChange={(e) => groupForm.setData('description', e.target.value)}
                                />
                                </div>
                                <div className={`rounded-lg border p-3 ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                                    <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{t.chooseStudents}</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 max-h-56 overflow-auto">
                                        {students.map((student) => (
                                            <label key={student.id} className={`flex items-center gap-2 rounded-md px-2 py-1 ${isDark ? 'bg-slate-800' : 'bg-gray-50'}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={groupForm.data.student_ids.includes(student.id)}
                                                    onChange={() => toggleStudent(student.id)}
                                                />
                                                <span className={`text-sm ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{student.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <button className="sr-btn-action-secondary max-w-xs">
                                    {t.createBtn}
                                </button>
                            </form>
                        </div>
                    )}

                    <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-5`}>
                        <h3 className={`sr-subtitle mb-3 ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{t.groupsTitle}</h3>
                        {groups.length === 0 ? (
                            <p className={`${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t.noGroups}</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {groups.map((group) => (
                                    <div key={group.id} className={`rounded-xl border p-4 ${isDark ? 'border-slate-700 bg-slate-800/40' : 'border-gray-200 bg-gray-50/60'}`}>
                                        <h4 className={`font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{group.name}</h4>
                                        <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{group.description || '-'}</p>
                                        <p className="text-xs mt-2 text-blue-600">
                                            {t.members}: {group.members_count}
                                        </p>
                                        <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                            {t.myRole}:{' '}
                                            <span className={`font-bold ${group.user_group_role === 'admin' ? 'text-green-600' : 'text-slate-500'}`}>
                                                {group.user_group_role === 'admin' ? t.adminRole : t.memberRole}
                                            </span>
                                        </p>
                                        <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                            {t.latestMessage}:{' '}
                                            <span className="font-semibold">
                                                {group.latest_message?.message || t.noMessage}
                                            </span>
                                        </p>
                                        <div className="mt-3">
                                            <Link
                                                href={route('supervisor.groups.chat', group.id)}
                                                className="sr-btn-action-primary h-9 md:h-9 text-xs"
                                            >
                                                {t.openChat}
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
