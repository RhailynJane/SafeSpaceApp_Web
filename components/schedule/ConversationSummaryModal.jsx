"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Heart, Brain, Lightbulb, BookOpen, Download, Copy } from "lucide-react";
import { useState } from "react";
import jsPDF from "jspdf";

export function ConversationSummaryModal({ open, onOpenChange, summary, transcript }) {
  const [copied, setCopied] = useState(false);

  if (!summary) return null;

  const copyToClipboard = () => {
    const text = `Mental Health Assessment

${summary.assessment}

Emotional State: ${summary.emotionalState}

Key Insights:
${summary.keyInsights?.map((insight, i) => `${i + 1}. ${insight}`).join('\n')}

Identified Patterns:
${summary.patterns?.map((pattern, i) => `• ${pattern}`).join('\n')}

Coping Strategies:
${summary.coping_strategies?.map((strategy, i) => `${i + 1}. ${strategy}`).join('\n')}

Resources:
${summary.resources?.map((resource, i) => `• ${resource}`).join('\n')}

Next Steps:
${summary.nextSteps?.map((step, i) => `${i + 1}. ${step}`).join('\n')}

Your Strengths:
${summary.strengths?.map((strength, i) => `✓ ${strength}`).join('\n')}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadAssessmentPDF = () => {
    try {
      const doc = new jsPDF();
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const maxWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      // Title
      doc.setFontSize(18);
      doc.setTextColor(59, 130, 246); // Blue
      doc.text("Mental Health Assessment", margin, yPosition);
      yPosition += 12;

      // Date
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
      yPosition += 10;

      // Professional Assessment
      doc.setFontSize(14);
      doc.setTextColor(59, 130, 246);
      doc.text("Professional Assessment", margin, yPosition);
      yPosition += 8;

      doc.setFontSize(11);
      doc.setTextColor(50, 50, 50);
      const assessmentLines = doc.splitTextToSize(summary.assessment || "No assessment available", maxWidth);
      doc.text(assessmentLines, margin, yPosition);
      yPosition += assessmentLines.length * 5 + 8;

      // Emotional State
      if (summary.emotionalState) {
        doc.setFontSize(12);
        doc.setTextColor(100, 50, 200);
        doc.text("Current Emotional State:", margin, yPosition);
        yPosition += 6;

        doc.setFontSize(11);
        doc.setTextColor(50, 50, 50);
        const emotionalLines = doc.splitTextToSize(summary.emotionalState, maxWidth);
        doc.text(emotionalLines, margin + 2, yPosition);
        yPosition += emotionalLines.length * 5 + 8;
      }

      // Key Insights
      if (summary.keyInsights && summary.keyInsights.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(59, 130, 246);
        doc.text("Key Insights", margin, yPosition);
        yPosition += 7;

        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        summary.keyInsights.forEach((insight) => {
          const insightLines = doc.splitTextToSize(`• ${insight}`, maxWidth - 5);
          doc.text(insightLines, margin + 3, yPosition);
          yPosition += insightLines.length * 4.5 + 2;
        });
        yPosition += 4;
      }

      // Patterns
      if (summary.patterns && summary.patterns.length > 0) {
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(12);
        doc.setTextColor(255, 107, 107);
        doc.text("Identified Patterns", margin, yPosition);
        yPosition += 7;

        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        summary.patterns.forEach((pattern) => {
          const patternLines = doc.splitTextToSize(`⚠ ${pattern}`, maxWidth - 5);
          doc.text(patternLines, margin + 3, yPosition);
          yPosition += patternLines.length * 4.5 + 2;
        });
        yPosition += 4;
      }

      // Coping Strategies
      if (summary.coping_strategies && summary.coping_strategies.length > 0) {
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(12);
        doc.setTextColor(34, 197, 94);
        doc.text("Recommended Coping Strategies", margin, yPosition);
        yPosition += 7;

        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        summary.coping_strategies.forEach((strategy, idx) => {
          const strategyLines = doc.splitTextToSize(`${idx + 1}. ${strategy}`, maxWidth - 5);
          doc.text(strategyLines, margin + 3, yPosition);
          yPosition += strategyLines.length * 4.5 + 2;
        });
        yPosition += 4;
      }

      // Resources
      if (summary.resources && summary.resources.length > 0) {
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(12);
        doc.setTextColor(168, 85, 247);
        doc.text("Suggested Resources", margin, yPosition);
        yPosition += 7;

        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        summary.resources.forEach((resource) => {
          const resourceLines = doc.splitTextToSize(`• ${resource}`, maxWidth - 5);
          doc.text(resourceLines, margin + 3, yPosition);
          yPosition += resourceLines.length * 4.5 + 2;
        });
      }

      // Strengths
      if (summary.strengths && summary.strengths.length > 0) {
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(12);
        doc.setTextColor(34, 197, 94);
        doc.text("Your Strengths", margin, yPosition);
        yPosition += 7;

        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        summary.strengths.forEach((strength) => {
          const strengthLines = doc.splitTextToSize(`✓ ${strength}`, maxWidth - 5);
          doc.text(strengthLines, margin + 3, yPosition);
          yPosition += strengthLines.length * 4.5 + 2;
        });
      }

      doc.save(`mental-health-assessment-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto dark:bg-gray-900 dark:border-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 dark:text-white">
            <Brain className="w-5 h-5 text-purple-500" />
            Mental Health Assessment
          </DialogTitle>
          <DialogDescription>
            Professional assessment based on your conversation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Professional Assessment */}
          {summary.assessment && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-5 border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Professional Assessment
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                {summary.assessment}
              </p>
            </div>
          )}

          {/* Emotional State */}
          {summary.emotionalState && (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-5 border border-purple-200 dark:border-purple-800">
              <h3 className="font-semibold text-purple-900 dark:text-purple-200 mb-3 flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Your Emotional State
              </h3>
              <p className="text-sm text-purple-800 dark:text-purple-300">{summary.emotionalState}</p>
            </div>
          )}

          {/* Key Insights */}
          {summary.keyInsights && summary.keyInsights.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                Key Insights
              </h3>
              <div className="space-y-2">
                {summary.keyInsights.map((insight, idx) => (
                  <div key={idx} className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-800 dark:text-yellow-300">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Patterns */}
          {summary.patterns && summary.patterns.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                Identified Patterns
              </h3>
              <div className="space-y-2">
                {summary.patterns.map((pattern, idx) => (
                  <div key={idx} className="bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-800 dark:text-red-300">⚠ {pattern}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coping Strategies */}
          {summary.coping_strategies && summary.coping_strategies.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-green-500" />
                Recommended Coping Strategies
              </h3>
              <div className="space-y-2">
                {summary.coping_strategies.map((strategy, idx) => (
                  <div key={idx} className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-800 dark:text-green-300">
                      <strong>{idx + 1}.</strong> {strategy}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resources */}
          {summary.resources && summary.resources.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-500" />
                Suggested Resources
              </h3>
              <div className="space-y-2">
                {summary.resources.map((resource, idx) => (
                  <div key={idx} className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded border border-purple-200 dark:border-purple-800">
                    <p className="text-sm text-purple-800 dark:text-purple-300">• {resource}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths */}
          {summary.strengths && summary.strengths.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Your Strengths
              </h3>
              <div className="space-y-2">
                {summary.strengths.map((strength, idx) => (
                  <div key={idx} className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-800 dark:text-green-300">✓ {strength}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Steps */}
          {summary.nextSteps && summary.nextSteps.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                Suggested Next Steps
              </h3>
              <div className="space-y-2">
                {summary.nextSteps.map((step, idx) => (
                  <div key={idx} className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      <strong>{idx + 1}.</strong> {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Supportive Message */}
          {summary.supportiveMessage && (
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-lg p-5 border border-pink-200 dark:border-pink-800 italic">
              <p className="text-sm text-pink-900 dark:text-pink-200">
                💝 {summary.supportiveMessage}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t dark:border-gray-700">
            <Button onClick={copyToClipboard} variant="outline" className="flex-1">
              <Copy className="w-4 h-4 mr-2" />
              {copied ? "Copied!" : "Copy Text"}
            </Button>
            <Button onClick={downloadAssessmentPDF} variant="outline" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={() => onOpenChange(false)} className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
