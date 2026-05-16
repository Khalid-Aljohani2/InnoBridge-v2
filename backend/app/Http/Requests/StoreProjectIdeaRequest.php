<?php

namespace App\Http\Requests;

use App\Models\TeamMember;
use Illuminate\Foundation\Http\FormRequest;

class StoreProjectIdeaRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->role === 'student';
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'file' => 'required|file|mimes:pdf,doc,docx,zip|max:20480',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $user = auth()->user();

            // Fetch the student's team and its members
            $teamMember = TeamMember::where('user_id', $user->id)->with('team.members')->first();

            // 1. Must be in a team
            if (!$teamMember || !$teamMember->team) {
                $validator->errors()->add('team', 'عذراً، يجب عليك إنشاء فريق أو الانضمام إليه أولاً قبل رفع فكرة المشروع.');
                return;
            }

            $team = $teamMember->team;
            $membersCount = $team->members->count();

            // 2. Team Constraints (Min: 2, Max: 4)
            if ($membersCount < 2 || $membersCount > 4) {
                $validator->errors()->add('team', "لا يمكن رفع الفكرة. يجب أن يتكون الفريق من طالبين كحد أدنى و4 كحد أقصى (العدد الحالي: {$membersCount}).");
            }

            // 3. Supervision Constraint (Must have a supervisor and must be approved by HoD)
            if (empty($team->supervisor_id)) {
                $validator->errors()->add('supervisor', 'لا يمكن رفع الفكرة. لم يتم تعيين مشرف لفريقك بعد.');
            } elseif ($team->review_status !== 'approved') {
                $validator->errors()->add('supervisor', 'لا يمكن رفع الفكرة. المشرف أو الفريق الحالي بانتظار الاعتماد من قبل رئيس القسم.');
            }
        });
    }
}
