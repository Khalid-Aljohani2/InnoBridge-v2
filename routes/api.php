<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EvaluationController;
use App\Http\Controllers\Api\MilestoneController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\ProposalController;
use App\Http\Controllers\Api\SubmissionController;
use App\Models\IndustryChallenge;

// ==========================================
// مسارات عامة (لا تحتاج تسجيل دخول / Token)
// ==========================================

// رابط تسجيل حساب جديد
Route::post('/register', [AuthController::class, 'register']);

// رابط تسجيل الدخول
Route::post('/login', [AuthController::class, 'login']);

// جلب تحديات الصناعة بشكل JSON
Route::get('/challenges', function () {
    return response()->json([
        'status' => 'success',
        'data' => IndustryChallenge::with('postedBy:id,name')->latest()->get(),
    ]);
});


// ==========================================
// مسارات محمية (يجب أن يكون المستخدم مسجل دخول)
// ==========================================
Route::middleware('auth:sanctum')->group(function () {
    // رابط لمعرفة من هو المستخدم الذي قام بتسجيل الدخول حالياً
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // تسجيل خروج وإبطال التوكن الحالي
    Route::post('/logout', [AuthController::class, 'logout']);

    // Project workflow
    Route::get('/projects', [ProjectController::class, 'index']);
    Route::post('/projects', [ProjectController::class, 'store']);
    Route::get('/projects/{project}', [ProjectController::class, 'show']);
    Route::patch('/projects/{project}', [ProjectController::class, 'update']);

    // Proposal workflow
    Route::get('/proposals', [ProposalController::class, 'index']);
    Route::get('/proposals/{proposal}', [ProposalController::class, 'show']);
    Route::post('/proposals', [ProposalController::class, 'store'])
        ->middleware('role:student');
    Route::post('/proposals/{proposal}/review', [ProposalController::class, 'review'])
        ->middleware('role:supervisor,industry,admin');

    Route::get('/projects/{project}/milestones', [MilestoneController::class, 'index']);
    Route::post('/projects/{project}/milestones', [MilestoneController::class, 'store'])
        ->middleware('role:supervisor,admin');
    Route::patch('/projects/{project}/milestones/{milestone}', [MilestoneController::class, 'update'])
        ->middleware('role:supervisor,admin');

    Route::get('/milestones/{milestone}/submissions', [SubmissionController::class, 'index']);
    Route::post('/milestones/{milestone}/submissions', [SubmissionController::class, 'store'])
        ->middleware('role:student');
    Route::patch('/submissions/{submission}', [SubmissionController::class, 'update']);

    Route::get('/submissions/{submission}/evaluations', [EvaluationController::class, 'index']);
    Route::post('/submissions/{submission}/evaluations', [EvaluationController::class, 'store'])
        ->middleware('role:supervisor,admin');
    Route::patch('/evaluations/{evaluation}', [EvaluationController::class, 'update']);
});