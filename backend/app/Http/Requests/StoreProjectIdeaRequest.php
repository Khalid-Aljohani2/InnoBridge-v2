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
        if (!auth()->check() || auth()->user()->role !== 'student') {
            return false;
        }

        $user = auth()->user();
        $teamMember = TeamMember::where('user_id', $user->id)->with('team')->first();

        // Must have a team
        if (!$teamMember || !$teamMember->team) {
            return false;
        }

        // Team must be approved and have a supervisor
        $team = $teamMember->team;
        if (empty($team->supervisor_id) || $team->review_status !== 'approved') {
            return false;
        }

        return true;
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

            $team = $teamMember->team;
            $membersCount = $team->members->count();

            // 2. Team Constraints (Min: 2, Max: 4)
            if ($membersCount < 2 || $membersCount > 4) {
                $validator->errors()->add('team', "لا يمكن رفع الفكرة. يجب أن يتكون الفريق من طالبين كحد أدنى و4 كحد أقصى (العدد الحالي: {$membersCount}).");
            }
        });
    }
}
